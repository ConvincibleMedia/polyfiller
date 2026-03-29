import test from 'node:test';
import assert from 'node:assert/strict';
import { PolyfillScanner } from '../../src/core/polyfill-scanner.js';
import { VersionedPolyfillRegistry } from '../../src/core/versioned-polyfill-registry.js';
import { withWorkspace } from '../support/test-workspace.js';

test('PolyfillScanner ignores old, test, and tmp directories while scanning', async () => {
	await withWorkspace({
		workspaceName: 'polyfill-scanner-ignored-directories',
		filesByRelativePath: {
			'src/app.js': 'AbortController;\n',
			'old/legacy.js': 'Promise.any([]);\n',
			'test/specimen.js': 'fetch("/ignored");\n',
			'tmp/generated.js': 'Object.assign({}, {});\n',
			'polyfills/4.8.0.txt': 'AbortController\nPromise\nPromise.any\nfetch\nObject.assign\n'
		}
	}, async (workspacePath) => {
		const scanner = new PolyfillScanner({
			registry: new VersionedPolyfillRegistry({
				polyfillDirectory: `${workspacePath}/polyfills`
			})
		});
		const result = await scanner.analyse({
			cwd: workspacePath,
			pattern: '**/*.js',
			targetVersion: '4.8.0'
		});

		assert.deepEqual(result.detectedFeatures, ['AbortController']);
		assert.equal(result.matchedFileCount, 1);
	});
});

test('PolyfillScanner reports when no JavaScript files match the requested pattern', async () => {
	const scanner = new PolyfillScanner();

	await assert.rejects(async () => scanner.analyse({
		cwd: process.cwd(),
		pattern: 'spec/fixtures/does-not-exist/**/*.js',
		targetVersion: '4.8.0'
	}), /No JavaScript files matched/);
});

test('PolyfillScanner rejects version files that contain uncatalogued polyfills', async () => {
	await withWorkspace({
		workspaceName: 'polyfill-scanner-uncatalogued-feature',
		filesByRelativePath: {
			'src/app.js': 'AbortController;\n',
			'polyfills/1.0.0.txt': 'AbortController\nCompletelyUnknownFeature\n'
		}
	}, async (workspacePath) => {
		const scanner = new PolyfillScanner({
			registry: new VersionedPolyfillRegistry({
				polyfillDirectory: `${workspacePath}/polyfills`
			})
		});

		await assert.rejects(async () => scanner.analyse({
			cwd: workspacePath,
			pattern: 'src/**/*.js',
			targetVersion: '1.0.0'
		}), /The feature catalogue does not cover these polyfills/);
	});
});
