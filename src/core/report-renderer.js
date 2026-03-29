import path from 'node:path';

/**
 * Render a human-readable breakdown of which files required which polyfills.
 * This output is meant for terminal inspection and is kept separate from the machine-readable feature array.
 *
 * @param {object} options
 * @param {Map<string, Set<string>>} options.featuresByFilePath
 * @param {Map<string, number>} options.fileCountsByFeature
 * @param {string} options.cwd
 * @returns {string}
 */
export function renderReport({ featuresByFilePath, fileCountsByFeature, cwd }) {
	const reportLines = [];
	const sortedFilePaths = Array.from(featuresByFilePath.keys()).sort();

	reportLines.push('File -> polyfills');

	for (const filePath of sortedFilePaths) {
		const displayPath = normaliseDisplayPath(path.relative(cwd, filePath) || filePath);
		reportLines.push(`${displayPath}`);

		for (const featureName of Array.from(featuresByFilePath.get(filePath)).sort()) {
			reportLines.push(`  * ${featureName}`);
		}
	}

	reportLines.push('');
	reportLines.push('Polyfill -> file count');

	for (const [featureName, fileCount] of Array.from(fileCountsByFeature.entries()).sort((left, right) => {
		if (right[1] !== left[1]) {
			return right[1] - left[1];
		}

		return left[0].localeCompare(right[0]);
	})) {
		reportLines.push(`${featureName}: ${fileCount}`);
	}

	return reportLines.join('\n');
}

/**
 * Render any non-fatal warnings gathered while scanning.
 *
 * @param {object} options
 * @param {string[]} options.warnings
 * @returns {string}
 */
export function renderWarnings({ warnings }) {
	if (warnings.length === 0) {
		return '';
	}

	return [
		'Warnings',
		...warnings.map((warningMessage) => `* ${warningMessage}`)
	].join('\n');
}

function normaliseDisplayPath(filePath) {
	return filePath.split(path.sep).join('/');
}
