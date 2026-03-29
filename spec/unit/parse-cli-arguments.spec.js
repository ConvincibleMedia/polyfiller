import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCliArguments, renderHelp } from '../../src/cli/parse-cli-arguments.js';

/**
 * Exercise CLI parsing while preserving the process globals that the parser reads.
 *
 * @param {object} options
 * @param {string[]} options.argv
 * @param {string[]} [options.processArgv]
 * @param {() => void} callback
 */
function withProcessState({ argv, processArgv = ['/usr/bin/node', '/workspace/bin/polyfiller.js'] }, callback) {
	const originalArgv = process.argv;
	process.argv = processArgv;

	try {
		return callback(parseCliArguments(argv));
	} finally {
		process.argv = originalArgv;
	}
}

test('parseCliArguments normalises the supported options', () => {
	withProcessState({
		argv: ['src/**/*.js', '--output', 'build/polyfills.yml', '--format', 'yaml', '--polyfill-library-version', '4.8.0', '--report']
	}, (command) => {
		assert.equal(command.pattern, 'src/**/*.js');
		assert.equal(command.outputFilePath, 'build/polyfills.yml');
		assert.equal(command.outputFormat, 'yaml');
		assert.equal(command.targetVersion, '4.8.0');
		assert.equal(command.report, true);
		assert.equal(command.help, false);
		assert.equal(command.version, false);
		assert.equal(command.executableName, 'polyfiller');
		assert.equal(command.cwd, process.cwd());
	});
});

test('parseCliArguments recognises help and version without needing a pattern', () => {
	withProcessState({
		argv: ['--help', '--version']
	}, (command) => {
		assert.equal(command.help, true);
		assert.equal(command.version, true);
		assert.equal(command.pattern, undefined);
	});
});

test('parseCliArguments rejects unknown options and missing values', () => {
	assert.throws(() => withProcessState({
		argv: ['--mystery']
	}, () => {}), /Unknown option/);
	assert.throws(() => withProcessState({
		argv: ['src/**/*.js', '--output']
	}, () => {}), /requires a value/);
});

test('renderHelp includes the main options and aliases', () => {
	assert.match(renderHelp({ executableName: 'polyfiller' }), /--polyfill-library-version/);
	assert.match(renderHelp({ executableName: 'polyfiller' }), /^Usage: polyfiller/mu);
});
