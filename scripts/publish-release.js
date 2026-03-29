import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT_PATH = fileURLToPath(new URL('../', import.meta.url));
const PACKAGE_JSON_PATH = fileURLToPath(new URL('../package.json', import.meta.url));
const PACKAGE_CONFIGURATION = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
const releaseOptions = parseReleaseOptions(process.argv.slice(2));

/**
 * Publish the current package from the local working copy after a few release-safety checks.
 * The workflow is local on purpose so publishing stays under the maintainer's direct control.
 */
function main() {
	if (releaseOptions.help) {
		process.stdout.write(`${renderHelp()}\n`);
		return;
	}

	ensureSupportedPackageConfiguration();
	ensureWorkingTreeIsClean();
	ensureNpmSessionIsReady();
	runPackageDryRun();
	publishPackage();
}

/**
 * Parse the local release command options.
 * Keeping the option surface small makes the release path easier to audit and repeat.
 *
 * @param {string[]} argv
 * @returns {{ dryRun: boolean, npmDistTag: string | undefined, help: boolean }}
 */
function parseReleaseOptions(argv) {
	const options = {
		dryRun: false,
		npmDistTag: undefined,
		help: false
	};

	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];

		if (argument === '--dry-run') {
			options.dryRun = true;
			continue;
		}

		if (argument === '--help' || argument === '-h') {
			options.help = true;
			continue;
		}

		if (argument === '--npm-tag') {
			options.npmDistTag = readOptionValue({ argv, optionName: argument, nextIndex: index + 1 });
			index += 1;
			continue;
		}

		throw new Error(`Unknown option "${argument}". Run with --help for usage.`);
	}

	return options;
}

/**
 * Render the release-script help text.
 *
 * @returns {string}
 */
function renderHelp() {
	return [
		'Usage: npm run release:publish -- [options]',
		'',
		'Options:',
		'  --dry-run             Run every safety check and use npm publish --dry-run',
		'  --npm-tag <tag>       Publish to a non-default npm dist-tag such as next',
		'  --help, -h            Show this help text'
	].join('\n');
}

/**
 * Ensure the repository metadata still matches the intended npm organisation release path.
 *
 * @returns {void}
 */
function ensureSupportedPackageConfiguration() {
	if (PACKAGE_CONFIGURATION.name !== '@convinciblemedia/polyfiller') {
		throw new Error(`Expected package name "@convinciblemedia/polyfiller" but found "${PACKAGE_CONFIGURATION.name}".`);
	}

	if (PACKAGE_CONFIGURATION.publishConfig?.access !== 'public') {
		throw new Error('Expected package.json publishConfig.access to be set to "public".');
	}
}

/**
 * Refuse to publish from a dirty worktree so the published tarball always matches an intentional git commit.
 *
 * @returns {void}
 */
function ensureWorkingTreeIsClean() {
	const porcelainStatus = runCommand({
		command: 'git',
		argumentsList: ['status', '--porcelain'],
		captureOutput: true
	}).trim();

	if (porcelainStatus) {
		throw new Error('Working tree is not clean. Commit or stash local changes before publishing.');
	}
}

/**
 * Check that npm authentication is ready before the publish step starts.
 *
 * @returns {void}
 */
function ensureNpmSessionIsReady() {
	process.stdout.write('Checking npm authentication...\n');

	try {
		const npmUsername = runCommand({
			command: 'npm',
			argumentsList: ['whoami'],
			captureOutput: true
		}).trim();
		process.stdout.write(`Authenticated to npm as ${npmUsername}\n`);
	} catch (error) {
		throw new Error(`npm authentication is not ready. Run "npm login" with the publishing account before retrying. ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Build the same tarball npm would publish so release failures are caught before the publish request.
 *
 * @returns {void}
 */
function runPackageDryRun() {
	process.stdout.write('Running npm pack --dry-run...\n');
	runCommand({
		command: 'npm',
		argumentsList: ['pack', '--dry-run']
	});
}

/**
 * Publish the package publicly to npm, optionally using dry-run mode or a non-default dist-tag.
 *
 * @returns {void}
 */
function publishPackage() {
	const publishArguments = ['publish', '--access', 'public'];

	if (releaseOptions.npmDistTag) {
		publishArguments.push('--tag', releaseOptions.npmDistTag);
	}

	if (releaseOptions.dryRun) {
		publishArguments.push('--dry-run');
	}

	process.stdout.write(`Running npm ${publishArguments.join(' ')}...\n`);
	runCommand({
		command: 'npm',
		argumentsList: publishArguments
	});
}

/**
 * Run a child process from the repository root.
 * Captured commands return stdout so the release checks can validate git and npm state.
 *
 * @param {object} options
 * @param {string} options.command
 * @param {string[]} options.argumentsList
 * @param {boolean} [options.captureOutput]
 * @returns {string}
 */
function runCommand({ command, argumentsList, captureOutput = false }) {
	const result = spawnSync(command, argumentsList, {
		cwd: REPOSITORY_ROOT_PATH,
		env: process.env,
		encoding: 'utf8',
		stdio: captureOutput ? ['inherit', 'pipe', 'pipe'] : 'inherit'
	});

	if (result.error) {
		throw result.error;
	}

	if ((result.status ?? 0) !== 0) {
		const trimmedStderr = (result.stderr || '').trim();
		const failureSuffix = trimmedStderr ? ` ${trimmedStderr}` : '';
		throw new Error(`Command failed: ${command} ${argumentsList.join(' ')}.${failureSuffix}`);
	}

	return captureOutput ? result.stdout || '' : '';
}

/**
 * Read a required option value from the argument list.
 *
 * @param {object} options
 * @param {string[]} options.argv
 * @param {string} options.optionName
 * @param {number} options.nextIndex
 * @returns {string}
 */
function readOptionValue({ argv, optionName, nextIndex }) {
	const value = argv[nextIndex];

	if (!value || value.startsWith('-')) {
		throw new Error(`Option "${optionName}" requires a value.`);
	}

	return value;
}

main();
