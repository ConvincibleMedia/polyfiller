const GLOBAL_CONTAINER_NAMES = new Set(['globalThis', 'self', 'window']);
const WELL_KNOWN_SYMBOL_ALIASES = {
	asyncIterator: '@@asyncIterator',
	iterator: '@@iterator',
	matchAll: '@@matchAll',
	toStringTag: '@@toStringTag'
};
const TAG_NAME_TYPE_NAMES = {
	canvas: 'html-canvas-element',
	form: 'html-form-element',
	input: 'html-input-element',
	select: 'html-select-element'
};

/**
 * Return a static property name from a member expression when that name is known at build time.
 *
 * @param {object} node
 * @returns {string | null}
 */
export function getMemberPropertyName(node) {
	if (!node) {
		return null;
	}

	if (node.computed) {
		if (node.property?.type === 'StringLiteral') {
			return node.property.value;
		}

		const wellKnownSymbolAlias = getWellKnownSymbolAlias(node.property);
		return wellKnownSymbolAlias;
	}

	if (node.property?.type === 'Identifier') {
		return node.property.name;
	}

	return null;
}

/**
 * Build a static member chain such as `Promise.any` or `Object.prototype.toString`.
 * Chains are only returned when every segment is statically known.
 *
 * @param {object} node
 * @returns {string[] | null}
 */
export function getMemberChain(node) {
	if (!node || (node.type !== 'MemberExpression' && node.type !== 'OptionalMemberExpression')) {
		return null;
	}

	const propertyName = getMemberPropertyName(node);
	if (!propertyName) {
		return null;
	}

	if (node.object?.type === 'Identifier') {
		return [node.object.name, propertyName];
	}

	if (node.object?.type === 'MemberExpression' || node.object?.type === 'OptionalMemberExpression') {
		const parentChain = getMemberChain(node.object);
		return parentChain ? [...parentChain, propertyName] : null;
	}

	return null;
}

/**
 * Return the literal string value from a node when available.
 *
 * @param {object | null | undefined} node
 * @returns {string | null}
 */
export function getLiteralStringValue(node) {
	if (!node) {
		return null;
	}

	if (node.type === 'StringLiteral') {
		return node.value;
	}

	if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
		return node.quasis.map((quasi) => quasi.value.cooked ?? '').join('');
	}

	return null;
}

/**
 * Extract the most specific element type we can infer from a selector or tag name.
 *
 * @param {string | null} selectorText
 * @returns {string | null}
 */
export function getElementTypeFromSelector(selectorText) {
	if (!selectorText) {
		return null;
	}

	const match = selectorText.match(/^\s*([a-z][a-z0-9-]*)/iu);
	if (!match) {
		return 'element';
	}

	const tagName = match[1].toLowerCase();
	return TAG_NAME_TYPE_NAMES[tagName] ?? 'html-element';
}

/**
 * Whether the given identifier name is a global container like `window` or `globalThis`.
 *
 * @param {string} name
 * @returns {boolean}
 */
export function isGlobalContainerName(name) {
	return GLOBAL_CONTAINER_NAMES.has(name);
}

/**
 * Whether a Babel path's identifier name is unresolved in lexical scope.
 *
 * @param {object} path
 * @param {string} name
 * @returns {boolean}
 */
export function isUnboundIdentifier(path, name) {
	return !path.scope.hasBinding(name, true);
}

function getWellKnownSymbolAlias(node) {
	const chain = getMemberChain(node);
	if (!chain || chain.length !== 2) {
		return null;
	}

	if (chain[0] !== 'Symbol') {
		return null;
	}

	return WELL_KNOWN_SYMBOL_ALIASES[chain[1]] ?? null;
}
