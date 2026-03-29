const COMPATIBLE_TYPE_NAMES = {
	'array': new Set(['array']),
	'array-buffer': new Set(['array-buffer']),
	'character-data': new Set(['character-data']),
	'date': new Set(['date']),
	'document-fragment': new Set(['document-fragment']),
	'dom-token-list': new Set(['dom-token-list']),
	'element': new Set(['element', 'html-canvas-element', 'html-element', 'html-form-element', 'html-input-element', 'html-select-element']),
	'function': new Set(['class', 'function']),
	'html-canvas-element': new Set(['html-canvas-element']),
	'html-collection': new Set(['html-collection']),
	'html-element': new Set(['html-canvas-element', 'html-element', 'html-form-element', 'html-input-element', 'html-select-element']),
	'html-form-element': new Set(['html-form-element']),
	'html-input-element': new Set(['html-input-element']),
	'html-select-element': new Set(['html-select-element']),
	'media-query-list': new Set(['media-query-list']),
	'node': new Set(['character-data', 'document-fragment', 'element', 'html-canvas-element', 'html-element', 'html-form-element', 'html-input-element', 'html-select-element', 'node']),
	'node-list': new Set(['node-list']),
	'promise': new Set(['promise']),
	'regexp': new Set(['regexp']),
	'string': new Set(['string']),
	'symbol': new Set(['symbol']),
	'typed-array': new Set(['typed-array']),
	'url': new Set(['url'])
};

/**
 * Check whether an inferred runtime type can satisfy a detector's expected receiver type.
 *
 * @param {object} options
 * @param {string} options.actualType
 * @param {string} options.expectedType
 * @returns {boolean}
 */
export function doesTypeMatch({ actualType, expectedType }) {
	const compatibleTypeNames = COMPATIBLE_TYPE_NAMES[expectedType];
	return compatibleTypeNames ? compatibleTypeNames.has(actualType) : actualType === expectedType;
}
