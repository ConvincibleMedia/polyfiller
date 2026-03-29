import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SPEC_DIRECTORY = new URL('./', import.meta.url);
const COMMAND_LINE_ARGUMENTS = process.argv.slice(2);
const enableCoverage = COMMAND_LINE_ARGUMENTS.includes('--coverage');

/**
 * Run every `*.spec.js` file under `spec/` through Node's built-in test runner.
 * Keeping discovery in one place makes the npm script cross-platform without adding a test dependency.
 */
function main() {
	const specFilePaths = listSpecFilePaths(fileURLToPath(SPEC_DIRECTORY));
	const nodeArguments = [
		...(enableCoverage ? ['--experimental-test-coverage'] : []),
		'--test',
		...specFilePaths
	];
	const result = spawnSync(process.execPath, nodeArguments, {
		cwd: process.cwd(),
		env: process.env,
		stdio: 'inherit'
	});

	if (result.error) {
		throw result.error;
	}

	process.exitCode = result.status ?? 1;
}

/**
 * Recursively collect the repository's spec files while skipping support and fixture assets.
 *
 * @param {string} directoryPath
 * @returns {string[]}
 */
function listSpecFilePaths(directoryPath) {
	const specFilePaths = [];

	for (const directoryEntry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
		if (directoryEntry.name === 'fixtures' || directoryEntry.name === 'support') {
			continue;
		}

		const entryPath = path.join(directoryPath, directoryEntry.name);
		if (directoryEntry.isDirectory()) {
			specFilePaths.push(...listSpecFilePaths(entryPath));
			continue;
		}

		if (directoryEntry.isFile() && directoryEntry.name.endsWith('.spec.js')) {
			specFilePaths.push(entryPath);
		}
	}

	return specFilePaths.sort();
}

main();
