import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runCli as runCliCommand } from '../../src/cli/run-cli.js';
import { withWorkspace } from '../support/test-workspace.js';

const CLI_ENTRY_PATH = path.resolve(process.cwd(), 'bin/polyfiller.js');
const DASHBOARD_FIXTURE_DIRECTORY = path.resolve(process.cwd(), 'spec/fixtures/scanner/aggregation/dashboard-bundle');

/**
 * Execute the CLI module in-process while capturing stdout, stderr, cwd, and exit code changes.
 * This keeps the integration tests close to real CLI behaviour without relying on nested child-process spawning.
 *
 * @param {object} options
 * @param {string[]} options.arguments
 * @param {string} options.cwd
 * @returns {Promise<{ exitCode: number, stdout: string, stderr: string }>}
 */
async function runCli({ arguments: commandArguments, cwd }) {
	const originalArgv = process.argv;
	const originalCwd = process.cwd();
	const originalExitCode = process.exitCode;
	const originalStdoutWrite = process.stdout.write;
	const originalStderrWrite = process.stderr.write;
	let stdout = '';
	let stderr = '';

	process.argv = [process.execPath, CLI_ENTRY_PATH, ...commandArguments];
	process.chdir(cwd);
	process.exitCode = undefined;
	process.stdout.write = ((chunk) => {
		const chunkText = String(chunk);
		if (!isTestHarnessOutput(chunkText)) {
			stdout += chunkText;
		}

		return true;
	});
	process.stderr.write = ((chunk) => {
		const chunkText = String(chunk);
		if (!isTestHarnessOutput(chunkText)) {
			stderr += chunkText;
		}

		return true;
	});

	try {
		await runCliImplementation();

		return {
			exitCode: process.exitCode ?? 0,
			stdout,
			stderr
		};
	} finally {
		process.stdout.write = originalStdoutWrite;
		process.stderr.write = originalStderrWrite;
		process.exitCode = originalExitCode;
		process.chdir(originalCwd);
		process.argv = originalArgv;
	}
}

async function runCliImplementation() {
	try {
		await runCliCommand();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		process.stderr.write(`${message}\n`);
		process.exitCode = 1;
	}
}

function isTestHarnessOutput(chunkText) {
	return /^(TAP version \d+|# Subtest: |ok \d+ |not ok \d+ |1\.\.\d+|# tests |# suites |# pass |# fail |# cancelled |# skipped |# todo |# duration_ms )/u.test(chunkText);
}

function parseJsonArrayFromOutput(outputText) {
	const jsonStartIndex = outputText.indexOf('[');
	const jsonEndIndex = outputText.lastIndexOf(']');

	if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex < jsonStartIndex) {
		throw new Error(`Could not find a JSON array in CLI output: ${JSON.stringify(outputText)}`);
	}

	return JSON.parse(outputText.slice(jsonStartIndex, jsonEndIndex + 1));
}

test('CLI prints help text without requiring a glob pattern', { concurrency: false }, async () => {
	const result = await runCli({
		arguments: ['--help'],
		cwd: process.cwd()
	});

	assert.equal(result.exitCode, 0);
	assert.match(result.stdout, /^Usage: polyfiller/mu);
	assert.equal(result.stderr, '');
});

test('CLI emits machine-readable JSON to stdout and manual checks to stderr', { concurrency: false }, async () => {
	const result = await runCli({
		arguments: ['**/*.js', '--polyfill-version', '4.8.0'],
		cwd: DASHBOARD_FIXTURE_DIRECTORY
	});

	assert.equal(result.exitCode, 0);
	assert.deepEqual(parseJsonArrayFromOutput(result.stdout), [
		'AbortController',
		'DOMTokenList.prototype.forEach',
		'Element.prototype.classList',
		'Event.hashchange',
		'NodeList.prototype.@@iterator',
		'NodeList.prototype.forEach',
		'Object.assign',
		'Promise',
		'Promise.allSettled',
		'URL',
		'URL.prototype.toJSON',
		'fetch'
	]);
	assert.match(result.stderr, /^Please check manually/mu);
	assert.doesNotMatch(result.stderr, /File -> polyfills/mu);
});

test('CLI can write YAML output to a file and append the human-readable report to stderr', { concurrency: false }, async () => {
	await withWorkspace({
		workspaceName: 'cli-output-workspace',
		filesByRelativePath: {}
	}, async (workspacePath) => {
		const outputFilePath = path.join(workspacePath, 'reports/polyfills.yml');
		const result = await runCli({
			arguments: ['**/*.js', '--polyfill-library-version', '4.8.0', '--output', outputFilePath, '--report'],
			cwd: DASHBOARD_FIXTURE_DIRECTORY
		});

		assert.equal(result.exitCode, 0);
		assert.equal(result.stdout, '');
		assert.match(result.stderr, /Wrote 12 detected feature\(s\)/mu);
		assert.match(result.stderr, /^Please check manually/mu);
		assert.match(result.stderr, /^File -> polyfills/mu);
		assert.equal(await fs.readFile(outputFilePath, 'utf8'), [
			'- "AbortController"',
			'- "DOMTokenList.prototype.forEach"',
			'- "Element.prototype.classList"',
			'- "Event.hashchange"',
			'- "NodeList.prototype.@@iterator"',
			'- "NodeList.prototype.forEach"',
			'- "Object.assign"',
			'- "Promise"',
			'- "Promise.allSettled"',
			'- "URL"',
			'- "URL.prototype.toJSON"',
			'- "fetch"',
			''
		].join('\n'));
	});
});

test('CLI reports a friendly error when no pattern is supplied', { concurrency: false }, async () => {
	const result = await runCli({
		arguments: [],
		cwd: process.cwd()
	});

	assert.equal(result.exitCode, 1);
	assert.equal(result.stdout, '');
	assert.match(result.stderr, /A JavaScript glob pattern is required/);
});
