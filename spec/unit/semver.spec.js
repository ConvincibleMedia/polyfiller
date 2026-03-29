import test from 'node:test';
import assert from 'node:assert/strict';
import { compareSemver, parseSemver } from '../../src/support/semver.js';

test('parseSemver splits a simple semantic version into numeric parts', () => {
	assert.deepEqual(parseSemver('4.8.0'), [4, 8, 0]);
});

test('compareSemver orders versions numerically rather than lexically', () => {
	assert.ok(compareSemver('4.8.0', '3.111.0') > 0);
	assert.ok(compareSemver('3.111.0', '4.8.0') < 0);
	assert.equal(compareSemver('4.8.0', '4.8.0'), 0);
});
