import * as babelParser from '@babel/parser';
import traverseModule from '@babel/traverse';
import { getLiteralStringValue, getMemberChain, getMemberPropertyName, isGlobalContainerName, isUnboundIdentifier } from './ast-helpers.js';
import { ExpressionTypeInferrer } from './expression-type-inferrer.js';
import { doesTypeMatch } from './type-relations.js';

const traverse = traverseModule.default ?? traverseModule;
const ARRAY_PATTERN_NODE_TYPES = new Set(['ArrayPattern']);
const ERROR_CONSTRUCTOR_NAMES = new Set(['AggregateError', 'Error', 'EvalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError']);
const EVENT_FEATURE_NAMES_BY_EVENT_NAME = new Map([
	['focusin', 'Event.focusin'],
	['hashchange', 'Event.hashchange'],
	['onfocusin', 'Event.focusin'],
	['onhashchange', 'Event.hashchange']
]);
/**
 * Analyse one JavaScript file and return the polyfill feature names used within it.
 */
export class JavaScriptFileAnalyser {
	/**
	 * @param {object} options
	 * @param {Map<string, string>} options.featureByExactChain
	 * @param {Map<string, string[]>} options.featuresByGlobalRuntimeName
	 * @param {Map<string, object[]>} options.instanceDefinitionsByPropertyName
	 * @param {Set<string>} options.availableFeatureNames
	 * @param {object[]} options.iterationSyntaxDefinitions
	 */
	constructor({ featureByExactChain, featuresByGlobalRuntimeName, instanceDefinitionsByPropertyName, availableFeatureNames, iterationSyntaxDefinitions }) {
		this.featureByExactChain = featureByExactChain;
		this.featuresByGlobalRuntimeName = featuresByGlobalRuntimeName;
		this.instanceDefinitionsByPropertyName = instanceDefinitionsByPropertyName;
		this.availableFeatureNames = availableFeatureNames;
		this.iterationSyntaxDefinitions = iterationSyntaxDefinitions;
	}

	/**
	 * Analyse one file worth of source text.
	 *
	 * @param {object} options
	 * @param {string} options.filePath
	 * @param {string} options.sourceText
	 * @returns {Set<string>}
	 */
	analyseFile({ filePath, sourceText }) {
		this.filePath = filePath;
		this.detectedFeatureNames = new Set();
		this.typeInferrer = new ExpressionTypeInferrer();

		const ast = babelParser.parse(sourceText, {
			allowImportExportEverywhere: true,
			allowReturnOutsideFunction: true,
			errorRecovery: true,
			plugins: ['jsx'],
			sourceType: 'unambiguous'
		});

		traverse(ast, {
			AssignmentExpression: (path) => this.#analyseAssignmentExpression(path),
			CallExpression: (path) => this.#analyseCallExpression(path),
			ForOfStatement: (path) => this.#analyseForOfStatement(path),
			MemberExpression: (path) => this.#analyseMemberExpression(path),
			NewExpression: (path) => this.#analyseErrorCause(path),
			OptionalCallExpression: (path) => this.#analyseCallExpression(path),
			OptionalMemberExpression: (path) => this.#analyseMemberExpression(path),
			ReferencedIdentifier: (path) => this.#analyseReferencedIdentifier(path),
			SpreadElement: (path) => this.#analyseSpreadElement(path),
			VariableDeclarator: (path) => this.#analyseVariableDeclarator(path),
			YieldExpression: (path) => this.#analyseYieldExpression(path)
		});

		return this.detectedFeatureNames;
	}

	#analyseReferencedIdentifier(path) {
		if (!isUnboundIdentifier(path, path.node.name)) {
			return;
		}

		const matchingFeatureNames = this.featuresByGlobalRuntimeName.get(path.node.name) ?? [];
		for (const featureName of matchingFeatureNames) {
			this.#recordFeature(featureName);
		}
	}

	#analyseMemberExpression(path) {
		const candidateChains = this.#getCandidateChains(path);
		for (const candidateChain of candidateChains) {
			const exactFeatureName = this.featureByExactChain.get(candidateChain.join('.'));
			if (exactFeatureName) {
				this.#recordFeature(exactFeatureName);
			}
		}

		for (const candidateChain of candidateChains.slice(1)) {
			const rootFeatureNames = this.featuresByGlobalRuntimeName.get(candidateChain[0]) ?? [];
			for (const featureName of rootFeatureNames) {
				this.#recordFeature(featureName);
			}
		}

		const propertyName = getMemberPropertyName(path.node);
		if (!propertyName) {
			return;
		}

		const eventFeatureName = EVENT_FEATURE_NAMES_BY_EVENT_NAME.get(propertyName);
		if (eventFeatureName) {
			this.#recordFeature(eventFeatureName);
		}

		const instanceDefinitions = this.instanceDefinitionsByPropertyName.get(propertyName) ?? [];
		if (instanceDefinitions.length === 0) {
			return;
		}

		const receiverTypeNames = this.typeInferrer.inferTypesForPath(path.get('object'));
		for (const instanceDefinition of instanceDefinitions) {
			if (Array.from(receiverTypeNames).some((actualType) => instanceDefinition.receiverTypes.some((expectedType) => doesTypeMatch({ actualType, expectedType })))) {
				this.#recordFeature(instanceDefinition.featureName);
			}
		}
	}

	#analyseCallExpression(path) {
		this.#analyseErrorCause(path);

		const calleePath = path.get('callee');
		if (!calleePath.isMemberExpression() && !calleePath.isOptionalMemberExpression()) {
			return;
		}

		const propertyName = getMemberPropertyName(calleePath.node);
		if (!propertyName) {
			return;
		}

		if (propertyName === 'addEventListener' || propertyName === 'removeEventListener' || propertyName === 'attachEvent' || propertyName === 'detachEvent') {
			const firstArgumentValue = getLiteralStringValue(path.node.arguments?.[0]);
			if (firstArgumentValue) {
				const eventFeatureName = EVENT_FEATURE_NAMES_BY_EVENT_NAME.get(firstArgumentValue);
				if (eventFeatureName) {
					this.#recordFeature(eventFeatureName);
				}
			}
		}
	}

	#analyseErrorCause(path) {
		const calleePath = path.get('callee');
		if (!calleePath.isIdentifier()) {
			return;
		}

		if (!isUnboundIdentifier(calleePath, calleePath.node.name) || !ERROR_CONSTRUCTOR_NAMES.has(calleePath.node.name)) {
			return;
		}

		for (const argumentNode of path.node.arguments ?? []) {
			if (argumentNode?.type !== 'ObjectExpression') {
				continue;
			}

			for (const propertyNode of argumentNode.properties) {
				if (propertyNode.type !== 'ObjectProperty') {
					continue;
				}

				const propertyName = propertyNode.key.type === 'Identifier' ? propertyNode.key.name : getLiteralStringValue(propertyNode.key);
				if (propertyName === 'cause') {
					this.#recordFeature('Error.cause');
					return;
				}
			}
		}
	}

	#analyseForOfStatement(path) {
		this.#recordIterationFeatures(path.get('right'));

		if (path.node.await) {
			this.#recordFeature('Symbol.asyncIterator');
		}
	}

	#analyseSpreadElement(path) {
		this.#recordIterationFeatures(path.get('argument'));
	}

	#analyseYieldExpression(path) {
		if (path.node.delegate) {
			this.#recordIterationFeatures(path.get('argument'));
		}
	}

	#analyseVariableDeclarator(path) {
		if (ARRAY_PATTERN_NODE_TYPES.has(path.node.id.type) && path.node.init) {
			this.#recordIterationFeatures(path.get('init'));
		}
	}

	#analyseAssignmentExpression(path) {
		if (ARRAY_PATTERN_NODE_TYPES.has(path.node.left.type)) {
			this.#recordIterationFeatures(path.get('right'));
		}
	}

	#recordIterationFeatures(expressionPath) {
		const receiverTypeNames = this.typeInferrer.inferTypesForPath(expressionPath);
		for (const iterationDefinition of this.iterationSyntaxDefinitions) {
			if (Array.from(receiverTypeNames).some((actualType) => iterationDefinition.receiverTypes.some((expectedType) => doesTypeMatch({ actualType, expectedType })))) {
				this.#recordFeature(iterationDefinition.featureName);
			}
		}
	}

	#getCandidateChains(path) {
		const directChain = getMemberChain(path.node);
		if (!directChain) {
			return [];
		}

		const rootIdentifierPath = this.#getRootIdentifierPath(path);
		if (!rootIdentifierPath?.isIdentifier()) {
			return [];
		}

		const rootIdentifierName = rootIdentifierPath.node.name;
		if (!isUnboundIdentifier(rootIdentifierPath, rootIdentifierName)) {
			return [];
		}

		const candidateChains = [directChain];
		if (isGlobalContainerName(rootIdentifierName) && directChain.length > 1) {
			candidateChains.push(directChain.slice(1));
		}

		return candidateChains;
	}

	#getRootIdentifierPath(path) {
		let currentPath = path;

		while (currentPath?.isMemberExpression?.() || currentPath?.isOptionalMemberExpression?.()) {
			currentPath = currentPath.get('object');
		}

		return currentPath?.isIdentifier?.() ? currentPath : null;
	}

	#recordFeature(featureName) {
		if (this.availableFeatureNames.has(featureName)) {
			this.detectedFeatureNames.add(featureName);
		}
	}
}
