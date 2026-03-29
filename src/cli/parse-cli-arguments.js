import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PACKAGE_JSON_PATH = fileURLToPath(new URL('../../package.json', import.meta.url));
const PACKAGE_VERSION = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')).version;

/**
 * Parse the CLI arguments into a normalised command object.
 * The parser is intentionally small because the option surface is narrow and stable.
 *
 * @param {string[]} argv
 * @returns {object}
 */
export function parseCliArguments(argv) {
	const positionalArguments = [];
	const options = {
		outputFilePath: undefined,
		outputFormat: undefined,
		targetVersion: undefined,
		report: false,
		help: false,
		version: false
	};

	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];

		if (argument === '--help' || argument === '-h') {
			options.help = true;
			continue;
		}

		if (argument === '--version') {
			options.version = true;
			continue;
		}

		if (argument === '--report') {
			options.report = true;
			continue;
		}

		if (argument === '--output' || argument === '-o') {
			options.outputFilePath = readOptionValue({ argv, optionName: argument, nextIndex: index + 1 });
			index += 1;
			continue;
		}

		if (argument === '--format' || argument === '-f') {
			options.outputFormat = readOptionValue({ argv, optionName: argument, nextIndex: index + 1 });
			index += 1;
			continue;
		}

		if (argument === '--polyfill-version' || argument === '--polyfill-library-version') {
			options.targetVersion = readOptionValue({ argv, optionName: argument, nextIndex: index + 1 });
			index += 1;
			continue;
		}

		if (argument.startsWith('-')) {
			throw new Error(`Unknown option \"${argument}\".`);
		}

		positionalArguments.push(argument);
	}

	return {
		...options,
		pattern: positionalArguments[0],
		packageVersion: PACKAGE_VERSION,
		cwd: process.cwd(),
		executableName: path.basename(process.argv[1] || 'polyfiller').replace(/\.js$/u, '')
	};
}

/**
 * Render the CLI help text.
 *
 * @param {object} options
 * @param {string} options.executableName
 * @returns {string}
 */
export function renderHelp({ executableName }) {
	return [
		`Usage: ${executableName} <glob-pattern> [options]`,
		'',
		'Options:',
		'  --output, -o <path>                    Write the detected feature array to a file',
		'  --format, -f <json|yml|yaml>           Output format; defaults to JSON unless the output extension implies YAML',
		'  --polyfill-version <version>           Target a specific polyfill-library version; defaults to the latest supported version',
		'  --polyfill-library-version <version>   American-English alias for --polyfill-version',
		'  --report                               Print file -> polyfills and polyfill -> file count breakdowns to stderr',
		'  --help, -h                             Show this help text',
		'  --version                              Print the CLI package version'
	].join('\n');
}

function readOptionValue({ argv, optionName, nextIndex }) {
	const value = argv[nextIndex];

	if (!value || value.startsWith('-')) {
		throw new Error(`Option \"${optionName}\" requires a value.`);
	}

	return value;
}
