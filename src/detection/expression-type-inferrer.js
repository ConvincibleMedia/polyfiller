import { getElementTypeFromSelector, getLiteralStringValue, getMemberChain, getMemberPropertyName, isGlobalContainerName, isUnboundIdentifier } from './ast-helpers.js';

const TYPED_ARRAY_CONSTRUCTOR_NAMES = new Set([
	'Float32Array',
	'Float64Array',
	'Int16Array',
	'Int32Array',
	'Int8Array',
	'Uint16Array',
	'Uint32Array',
	'Uint8Array',
	'Uint8ClampedArray'
]);
const PROMISE_STATIC_METHOD_NAMES = new Set(['all', 'allSettled', 'any', 'race', 'reject', 'resolve']);
const ARRAY_RETURNING_CHAIN_NAMES = new Set(['Array.from', 'Array.of', 'Object.entries', 'Object.keys', 'Object.values']);

/**
 * Infer lightweight runtime receiver types from AST expressions.
 * The goal is not full type analysis; it is just enough signal to match polyfillable instance members accurately.
 */
export class ExpressionTypeInferrer {
	constructor() {
		this.bindingTypeCache = new WeakMap();
		this.nodeTypeCache = new WeakMap();
		this.activeNodes = new Set();
	}

	/**
	 * Infer the possible runtime types represented by a Babel path.
	 *
	 * @param {object | null | undefined} path
	 * @returns {Set<string>}
	 */
	inferTypesForPath(path) {
		if (!path?.node) {
			return new Set();
		}

		return new Set(this.#inferTypes(path));
	}

	#inferTypes(path) {
		if (!path?.node) {
			return new Set();
		}

		if (this.nodeTypeCache.has(path.node)) {
			return this.nodeTypeCache.get(path.node);
		}

		if (this.activeNodes.has(path.node)) {
			return new Set();
		}

		this.activeNodes.add(path.node);

		try {
			const inferredTypes = this.#inferTypesUncached(path);
			this.nodeTypeCache.set(path.node, inferredTypes);
			return inferredTypes;
		} finally {
			this.activeNodes.delete(path.node);
		}
	}

	#inferTypesUncached(path) {
		switch (path.node.type) {
			case 'ArrayExpression':
				return new Set(['array']);
			case 'ArrowFunctionExpression':
			case 'FunctionDeclaration':
			case 'FunctionExpression':
				return new Set(['function']);
			case 'ClassDeclaration':
			case 'ClassExpression':
				return new Set(['class']);
			case 'Identifier':
				return this.#inferIdentifierTypes(path);
			case 'NewExpression':
				return this.#inferNewExpressionTypes(path);
			case 'CallExpression':
			case 'OptionalCallExpression':
				return this.#inferCallExpressionTypes(path);
			case 'MemberExpression':
			case 'OptionalMemberExpression':
				return this.#inferMemberExpressionTypes(path);
			case 'RegExpLiteral':
				return new Set(['regexp']);
			case 'StringLiteral':
			case 'TemplateLiteral':
				return new Set(['string']);
			default:
				return new Set();
		}
	}

	#inferIdentifierTypes(path) {
		const binding = path.scope.getBinding(path.node.name);
		if (!binding) {
			return this.#inferUnboundIdentifierTypes(path.node.name);
		}

		if (this.bindingTypeCache.has(binding.path.node)) {
			return this.bindingTypeCache.get(binding.path.node);
		}

		const inferredTypes = new Set();

		for (const typeName of this.#inferTypesFromBindingPath(binding.path)) {
			inferredTypes.add(typeName);
		}

		for (const violationPath of binding.constantViolations) {
			for (const typeName of this.#inferTypesFromBindingViolation(violationPath)) {
				inferredTypes.add(typeName);
			}
		}

		this.bindingTypeCache.set(binding.path.node, inferredTypes);
		return inferredTypes;
	}

	#inferUnboundIdentifierTypes(identifierName) {
		switch (identifierName) {
			case 'window':
				return new Set(['window']);
			case 'document':
				return new Set(['document']);
			case 'navigator':
				return new Set(['navigator']);
			case 'Promise':
				return new Set(['promise-constructor']);
			default:
				return new Set();
		}
	}

	#inferTypesFromBindingPath(bindingPath) {
		if (bindingPath.isFunctionDeclaration() || bindingPath.isFunctionExpression() || bindingPath.isArrowFunctionExpression()) {
			return new Set(['function']);
		}

		if (bindingPath.isClassDeclaration() || bindingPath.isClassExpression()) {
			return new Set(['class']);
		}

		if (bindingPath.isVariableDeclarator()) {
			return this.#inferTypes(bindingPath.get('init'));
		}

		return new Set();
	}

	#inferTypesFromBindingViolation(violationPath) {
		if (violationPath.isAssignmentExpression()) {
			return this.#inferTypes(violationPath.get('right'));
		}

		if (violationPath.isUpdateExpression()) {
			return new Set();
		}

		return new Set();
	}

	#inferNewExpressionTypes(path) {
		const calleePath = path.get('callee');

		if (!calleePath.isIdentifier()) {
			return new Set();
		}

		if (!isUnboundIdentifier(calleePath, calleePath.node.name)) {
			return new Set();
		}

		switch (calleePath.node.name) {
			case 'ArrayBuffer':
				return new Set(['array-buffer']);
			case 'Date':
				return new Set(['date']);
			case 'Promise':
				return new Set(['promise']);
			case 'URL':
				return new Set(['url']);
			default:
				return TYPED_ARRAY_CONSTRUCTOR_NAMES.has(calleePath.node.name) ? new Set(['typed-array']) : new Set();
		}
	}

	#inferCallExpressionTypes(path) {
		const calleePath = path.get('callee');

		if (calleePath.isIdentifier()) {
			if (!isUnboundIdentifier(calleePath, calleePath.node.name)) {
				return new Set();
			}

			switch (calleePath.node.name) {
				case 'matchMedia':
					return new Set(['media-query-list']);
				case 'String':
					return new Set(['string']);
				case 'Symbol':
					return new Set(['symbol']);
				default:
					return new Set();
			}
		}

		if (!calleePath.isMemberExpression() && !calleePath.isOptionalMemberExpression()) {
			return new Set();
		}

		const propertyName = getMemberPropertyName(calleePath.node);
		if (!propertyName) {
			return new Set();
		}

		const candidateChains = this.#getCandidateChains(calleePath.node);
		for (const chain of candidateChains) {
			const joinedChain = chain.join('.');
			if (ARRAY_RETURNING_CHAIN_NAMES.has(joinedChain)) {
				return new Set(['array']);
			}

			if (joinedChain === 'document.createDocumentFragment') {
				return new Set(['document-fragment']);
			}

			if (joinedChain === 'document.createTextNode') {
				return new Set(['character-data']);
			}

			if (joinedChain === 'document.getElementById') {
				return new Set(['element']);
			}
		}

		const receiverTypes = this.#inferTypes(calleePath.get('object'));
		const selectorText = getLiteralStringValue(path.node.arguments?.[0]);

		if (propertyName === 'createElement' && receiverTypes.has('document')) {
			const elementType = getElementTypeFromSelector(selectorText);
			return new Set(elementType ? [elementType] : ['html-element']);
		}

		if (propertyName === 'querySelector' && (receiverTypes.has('document') || this.#hasElementType(receiverTypes))) {
			const elementType = getElementTypeFromSelector(selectorText);
			return new Set(elementType ? [elementType] : ['element']);
		}

		if (propertyName === 'closest' && this.#hasElementType(receiverTypes)) {
			const elementType = getElementTypeFromSelector(selectorText);
			return new Set(elementType ? [elementType] : ['element']);
		}

		if (propertyName === 'querySelectorAll' && (receiverTypes.has('document') || this.#hasElementType(receiverTypes))) {
			return new Set(['node-list']);
		}

		if ((propertyName === 'getElementsByClassName' || propertyName === 'getElementsByTagName' || propertyName === 'getElementsByTagNameNS') && (receiverTypes.has('document') || this.#hasElementType(receiverTypes))) {
			return new Set(['html-collection']);
		}

		if (propertyName === 'matchMedia' && candidateChains.some((chain) => chain.join('.') === 'window.matchMedia')) {
			return new Set(['media-query-list']);
		}

		if (PROMISE_STATIC_METHOD_NAMES.has(propertyName) && candidateChains.some((chain) => chain[0] === 'Promise')) {
			return new Set(['promise']);
		}

		return new Set();
	}

	#inferMemberExpressionTypes(path) {
		const propertyName = getMemberPropertyName(path.node);
		if (!propertyName) {
			return new Set();
		}

		const candidateChains = this.#getCandidateChains(path.node);
		if (candidateChains.some((chain) => chain.join('.') === 'document.head')) {
			return new Set(['html-element']);
		}

		const receiverTypes = this.#inferTypes(path.get('object'));

		if (propertyName === 'classList' && this.#hasElementType(receiverTypes)) {
			return new Set(['dom-token-list']);
		}

		if (propertyName === 'children' && this.#hasElementType(receiverTypes)) {
			return new Set(['html-collection']);
		}

		if ((propertyName === 'nextElementSibling' || propertyName === 'previousElementSibling' || propertyName === 'parentElement' || propertyName === 'firstElementChild' || propertyName === 'lastElementChild') && (this.#hasElementType(receiverTypes) || receiverTypes.has('character-data'))) {
			return new Set(['element']);
		}

		return new Set();
	}

	#hasElementType(typeNames) {
		return typeNames.has('element') || typeNames.has('html-canvas-element') || typeNames.has('html-element') || typeNames.has('html-form-element') || typeNames.has('html-input-element') || typeNames.has('html-select-element');
	}

	#getCandidateChains(node) {
		const chain = getMemberChain(node);
		if (!chain) {
			return [];
		}

		const candidateChains = [chain];
		if (isGlobalContainerName(chain[0]) && chain.length > 1) {
			candidateChains.push(chain.slice(1));
		}

		return candidateChains;
	}
}
