import test from 'node:test';
import assert from 'node:assert/strict';
import { loadScannerFixtureScenarios, runScannerFixtureScenario } from '../support/scanner-fixture-harness.js';

const scannerFixtureScenarios = await loadScannerFixtureScenarios();

for (const fixtureScenario of scannerFixtureScenarios) {
	const testName = `${fixtureScenario.fixtureName} (${fixtureScenario.scenario.name})`;

	test(`scanner fixture: ${testName}`, async () => {
		const result = await runScannerFixtureScenario({
			directoryPath: fixtureScenario.directoryPath,
			scenario: fixtureScenario.scenario
		});

		assert.equal(result.targetVersion, fixtureScenario.scenario.targetVersion);
		assert.deepEqual(result.detectedFeatures, fixtureScenario.scenario.expectedDetectedFeatures);
		assert.deepEqual(result.featuresByFilePath, fixtureScenario.scenario.expectedFeaturesByFilePath);
		assert.deepEqual(result.fileCountsByFeature, fixtureScenario.scenario.expectedFileCountsByFeature);
		assert.deepEqual(result.manualCheckFeatures, fixtureScenario.scenario.expectedManualCheckFeatures);
		assert.equal(result.matchedFileCount, fixtureScenario.scenario.expectedMatchedFileCount);
	});
}
