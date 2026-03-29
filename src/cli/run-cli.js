import { analysePolyfills } from '../core/polyfill-scanner.js';
import { resolveOutputFormat, serialiseFeatures } from '../core/output-serialiser.js';
import { renderReport, renderWarnings } from '../core/report-renderer.js';
import { writeTextFile } from '../support/filesystem.js';
import { parseCliArguments, renderHelp } from './parse-cli-arguments.js';

/**
 * Run the Polyfiller CLI from the current process arguments.
 *
 * @returns {Promise<void>}
 */
export async function runCli() {
	const command = parseCliArguments(process.argv.slice(2));

	if (command.help) {
		process.stdout.write(`${renderHelp({ executableName: command.executableName })}\n`);
		return;
	}

	if (command.versionRequested) {
		process.stdout.write(`${command.packageVersion}\n`);
		return;
	}

	if (!command.pattern) {
		throw new Error('A JavaScript glob pattern is required. Run with --help for usage.');
	}

	const analysis = await analysePolyfills({
		cwd: command.cwd,
		pattern: command.pattern,
		targetVersion: command.targetVersion
	});
	const outputFormat = resolveOutputFormat({
		requestedFormat: command.outputFormat,
		outputFilePath: command.outputFilePath
	});
	const serialisedFeatures = serialiseFeatures({
		features: analysis.detectedFeatures,
		format: outputFormat
	});

	if (command.outputFilePath) {
		await writeTextFile({ filePath: command.outputFilePath, contents: `${serialisedFeatures}\n` });
		process.stderr.write(`Wrote ${analysis.detectedFeatures.length} detected feature(s) to ${command.outputFilePath}\n`);
	} else {
		process.stdout.write(`${serialisedFeatures}\n`);
	}

	const warningReport = renderWarnings({ warnings: analysis.warnings });
	if (warningReport) {
		process.stderr.write(`${warningReport}\n`);
	}

	if (command.report) {
		const report = renderReport({
			featuresByFilePath: analysis.featuresByFilePath,
			fileCountsByFeature: analysis.fileCountsByFeature,
			cwd: command.cwd
		});
		process.stderr.write(`${report}\n`);
	}
}
