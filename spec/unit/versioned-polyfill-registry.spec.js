import test from 'node:test';
import assert from 'node:assert/strict';
import { VersionedPolyfillRegistry } from '../../src/core/versioned-polyfill-registry.js';
import { withWorkspace } from '../support/test-workspace.js';

test('VersionedPolyfillRegistry sorts versions semantically and returns the latest one', async () => {
	await withWorkspace({
		workspaceName: 'versioned-polyfill-registry-ordering',
		filesByRelativePath: {
			'polyfills/4.8.0.txt': 'URL\nPromise.any\n',
			'polyfills/3.111.0.txt': 'Promise\n'
		}
	}, async (workspacePath) => {
		const registry = new VersionedPolyfillRegistry({
			polyfillDirectory: `${workspacePath}/polyfills`
		});

		assert.deepEqual(await registry.listVersions(), ['3.111.0', '4.8.0']);
		assert.equal(await registry.getLatestVersion(), '4.8.0');
	});
});

test('VersionedPolyfillRegistry trims, de-duplicates, sorts, and caches a version file', async () => {
	await withWorkspace({
		workspaceName: 'versioned-polyfill-registry-normalisation',
		filesByRelativePath: {
			'polyfills/4.8.0.txt': ' URL \nPromise.any\nURL\nAbortController\n'
		}
	}, async (workspacePath) => {
		const registry = new VersionedPolyfillRegistry({
			polyfillDirectory: `${workspacePath}/polyfills`
		});

		const firstResult = await registry.getVersionData({ targetVersion: '4.8.0' });
		const secondResult = await registry.getVersionData({ targetVersion: '4.8.0' });

		assert.deepEqual(firstResult.availableFeatures, ['AbortController', 'Promise.any', 'URL']);
		assert.equal(firstResult, secondResult);
	});
});

test('VersionedPolyfillRegistry rejects unsupported versions', async () => {
	await withWorkspace({
		workspaceName: 'versioned-polyfill-registry-unsupported-version',
		filesByRelativePath: {
			'polyfills/4.8.0.txt': 'URL\n'
		}
	}, async (workspacePath) => {
		const registry = new VersionedPolyfillRegistry({
			polyfillDirectory: `${workspacePath}/polyfills`
		});

		await assert.rejects(async () => registry.getVersionData({ targetVersion: '3.111.0' }), /Unsupported polyfill version/);
	});
});
