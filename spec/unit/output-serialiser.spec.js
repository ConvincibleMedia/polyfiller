import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOutputFormat, serialiseFeatures, serializeFeatures } from '../../src/core/output-serialiser.js';

test('resolveOutputFormat prefers the explicitly requested format', () => {
	assert.equal(resolveOutputFormat({
		requestedFormat: 'yaml',
		outputFilePath: 'build/features.json'
	}), 'yml');
});

test('resolveOutputFormat infers YAML from the output extension and defaults to JSON otherwise', () => {
	assert.equal(resolveOutputFormat({
		outputFilePath: 'build/features.yml'
	}), 'yml');
	assert.equal(resolveOutputFormat({}), 'json');
});

test('serialiseFeatures emits stable JSON and YAML arrays', () => {
	assert.equal(serialiseFeatures({
		features: ['Promise', 'URL'],
		format: 'json'
	}), '[\n\t"Promise",\n\t"URL"\n]');
	assert.equal(serialiseFeatures({
		features: ['Promise', 'URL'],
		format: 'yml'
	}), '- "Promise"\n- "URL"');
	assert.equal(serializeFeatures({
		features: ['Promise'],
		format: 'json'
	}), '[\n\t"Promise"\n]');
});

test('resolveOutputFormat rejects unsupported names', () => {
	assert.throws(() => resolveOutputFormat({
		requestedFormat: 'toml'
	}), /Unsupported output format/);
});
