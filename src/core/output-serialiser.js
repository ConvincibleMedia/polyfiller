/**
 * Resolve the requested output format.
 * If an output file is present we infer from its extension before falling back to JSON.
 *
 * @param {object} options
 * @param {string | undefined} options.requestedFormat
 * @param {string | undefined} options.outputFilePath
 * @returns {'json' | 'yml'}
 */
export function resolveOutputFormat({ requestedFormat, outputFilePath }) {
	if (requestedFormat) {
		return normaliseOutputFormat(requestedFormat);
	}

	const inferredOutputFormat = inferOutputFormatFromFilePath(outputFilePath);
	if (inferredOutputFormat) {
		return inferredOutputFormat;
	}

	return 'json';
}

/**
 * Serialise the detected feature names as either JSON or YAML.
 * YAML output is intentionally kept to a simple quoted string array.
 *
 * @param {object} options
 * @param {string[]} options.features
 * @param {'json' | 'yml'} options.format
 * @returns {string}
 */
export function serialiseFeatures({ features, format }) {
	if (format === 'json') {
		return JSON.stringify(features, null, '\t');
	}

	return features.map((featureName) => `- ${JSON.stringify(featureName)}`).join('\n');
}

export const serializeFeatures = serialiseFeatures;

function inferOutputFormatFromFilePath(outputFilePath) {
	if (!outputFilePath) {
		return null;
	}

	if (/\.json$/iu.test(outputFilePath)) {
		return 'json';
	}

	if (/\.ya?ml$/iu.test(outputFilePath)) {
		return 'yml';
	}

	return null;
}

function normaliseOutputFormat(format) {
	const lowerCaseFormat = format.toLowerCase();

	if (lowerCaseFormat === 'json') {
		return 'json';
	}

	if (lowerCaseFormat === 'yml' || lowerCaseFormat === 'yaml') {
		return 'yml';
	}

	throw new Error(`Unsupported output format \"${format}\". Use json, yml, or yaml.`);
}
