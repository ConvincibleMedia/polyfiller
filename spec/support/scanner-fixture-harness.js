import fs from 'node:fs/promises';
import path from 'node:path';
import { PolyfillScanner } from '../../src/core/polyfill-scanner.js';

const SCANNER_FIXTURE_DIRECTORY = path.resolve(process.cwd(), 'spec/fixtures/scanner');

/**
 * Load every scanner fixture manifest and present each declared scenario as one runnable case.
 * A single fixture directory can hold multiple version-specific expectations against the same source files.
 */
export async function loadScannerFixtureScenarios() {
	const fixtureDirectoryPaths = await listFixtureDirectoryPaths(SCANNER_FIXTURE_DIRECTORY);
	const fixtureScenarios = [];

	for (const fixtureDirectoryPath of fixtureDirectoryPaths) {
		const manifestPath = path.join(fixtureDirectoryPath, 'expectations.json');
		const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

		for (const scenario of manifest.scenarios) {
			fixtureScenarios.push({
				fixtureName: path.relative(SCANNER_FIXTURE_DIRECTORY, fixtureDirectoryPath),
				directoryPath: fixtureDirectoryPath,
				scenario: {
					pattern: '**/*.js',
					...scenario
				}
			});
		}
	}

	return fixtureScenarios.sort((left, right) => {
		const leftKey = `${left.fixtureName}:${left.scenario.name}`;
		const rightKey = `${right.fixtureName}:${right.scenario.name}`;
		return leftKey.localeCompare(rightKey);
	});
}

/**
 * Execute one scanner fixture scenario and normalise the maps into plain objects for easy assertions.
 *
 * @param {object} options
 * @param {string} options.directoryPath
 * @param {object} options.scenario
 * @returns {Promise<object>}
 */
export async function runScannerFixtureScenario({ directoryPath, scenario }) {
	const scanner = new PolyfillScanner();
	const result = await scanner.analyse({
		cwd: directoryPath,
		pattern: scenario.pattern,
		targetVersion: scenario.targetVersion
	});

	return {
		targetVersion: result.targetVersion,
		detectedFeatures: result.detectedFeatures,
		featuresByFilePath: mapFeaturesByRelativeFilePath({
			baseDirectoryPath: directoryPath,
			featuresByFilePath: result.featuresByFilePath
		}),
		fileCountsByFeature: Object.fromEntries(Array.from(result.fileCountsByFeature.entries()).sort(([leftName], [rightName]) => leftName.localeCompare(rightName))),
		manualCheckFeatures: result.manualCheckFeatures,
		matchedFileCount: result.matchedFileCount
	};
}

function mapFeaturesByRelativeFilePath({ baseDirectoryPath, featuresByFilePath }) {
	const mappedEntries = Array.from(featuresByFilePath.entries())
		.map(([filePath, featureNames]) => [
			path.relative(baseDirectoryPath, filePath).split(path.sep).join('/'),
			Array.from(featureNames).sort()
		])
		.sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath));

	return Object.fromEntries(mappedEntries);
}

async function listFixtureDirectoryPaths(directoryPath) {
	const fixtureDirectoryPaths = [];

	for (const directoryEntry of await fs.readdir(directoryPath, { withFileTypes: true })) {
		if (!directoryEntry.isDirectory()) {
			continue;
		}

		const entryPath = path.join(directoryPath, directoryEntry.name);
		const manifestPath = path.join(entryPath, 'expectations.json');

		try {
			await fs.access(manifestPath);
			fixtureDirectoryPaths.push(entryPath);
		} catch {
			fixtureDirectoryPaths.push(...await listFixtureDirectoryPaths(entryPath));
		}
	}

	return fixtureDirectoryPaths;
}
