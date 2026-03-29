import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { renderReport, renderWarnings } from '../../src/core/report-renderer.js';

test('renderReport groups features by file and by feature count', () => {
	const cwd = path.resolve('/workspace');
	const report = renderReport({
		cwd,
		featuresByFilePath: new Map([
			[path.join(cwd, 'src/app.js'), new Set(['Promise.any', 'fetch'])],
			[path.join(cwd, 'src/dom.js'), new Set(['document', 'NodeList.prototype.forEach'])]
		]),
		fileCountsByFeature: new Map([
			['Promise.any', 1],
			['fetch', 1],
			['document', 1],
			['NodeList.prototype.forEach', 1]
		])
	});

	assert.equal(report, [
		'File -> polyfills',
		'src/app.js',
		'  * Promise.any',
		'  * fetch',
		'src/dom.js',
		'  * NodeList.prototype.forEach',
		'  * document',
		'',
		'Polyfill -> file count',
		'document: 1',
		'fetch: 1',
		'NodeList.prototype.forEach: 1',
		'Promise.any: 1'
	].join('\n'));
});

test('renderWarnings returns an empty string when there is nothing to report', () => {
	assert.equal(renderWarnings({ warnings: [] }), '');
});

test('renderWarnings prints one warning per line', () => {
	assert.equal(renderWarnings({
		warnings: ['Skipped non-JavaScript file content/index.html.', 'Skipped file content/bad.js: Could not parse JavaScript: Unexpected token (1:0)']
	}), [
		'Warnings',
		'* Skipped non-JavaScript file content/index.html.',
		'* Skipped file content/bad.js: Could not parse JavaScript: Unexpected token (1:0)'
	].join('\n'));
});
