import fs from 'node:fs/promises';
import path from 'node:path';
import fastGlobModule from 'fast-glob';
import { JavaScriptFileAnalyser } from '../detection/javascript-file-analyser.js';
import { EXACT_CHAIN_FEATURE_DEFINITIONS, GLOBAL_IDENTIFIER_FEATURE_DEFINITIONS, INSTANCE_MEMBER_FEATURE_DEFINITIONS, ITERATION_SYNTAX_FEATURE_DEFINITIONS } from '../detection/feature-catalogue.js';
import { VersionedPolyfillRegistry } from './versioned-polyfill-registry.js';

const fastGlob = fastGlobModule.default ?? fastGlobModule;
const DEFAULT_IGNORE_PATTERNS = ['**/old/**', '**/test/**', '**/tmp/**'];
const JAVASCRIPT_FILE_EXTENSIONS = new Set(['.cjs', '.js', '.jsx', '.mjs']);

/**
 * Coordinate version loading, file discovery, AST analysis, and result aggregation.
 */
export class PolyfillScanner {
	/**
	 * @param {object} [options]
	 * @param {VersionedPolyfillRegistry} [options.registry]
	 */
	constructor({ registry = new VersionedPolyfillRegistry() } = {}) {
		this.registry = registry;
		this.featureByExactChain = new Map(EXACT_CHAIN_FEATURE_DEFINITIONS.map((definition) => [definition.chain.join('.'), definition.featureName]));
		this.featuresByGlobalRuntimeName = new Map();
		this.instanceDefinitionsByPropertyName = new Map();
		this.iterationSyntaxDefinitions = ITERATION_SYNTAX_FEATURE_DEFINITIONS;

		for (const definition of GLOBAL_IDENTIFIER_FEATURE_DEFINITIONS) {
			const featureNames = this.featuresByGlobalRuntimeName.get(definition.runtimeName) ?? [];
			featureNames.push(definition.featureName);
			this.featuresByGlobalRuntimeName.set(definition.runtimeName, featureNames);
		}

		for (const definition of INSTANCE_MEMBER_FEATURE_DEFINITIONS) {
			const definitions = this.instanceDefinitionsByPropertyName.get(definition.propertyName) ?? [];
			definitions.push(definition);
			this.instanceDefinitionsByPropertyName.set(definition.propertyName, definitions);
		}
	}

	/**
	 * Analyse the requested JavaScript files and return the detected polyfill feature names.
	 *
	 * @param {object} options
	 * @param {string} options.cwd
	 * @param {string} options.pattern
	 * @param {string | undefined} options.targetVersion
	 * @returns {Promise<object>}
	 */
	async analyse({ cwd, pattern, targetVersion }) {
		const versionData = await this.registry.getVersionData({ targetVersion });
		const availableFeatureNames = new Set(versionData.availableFeatures);

		const patternList = Array.isArray(pattern) ? pattern : [pattern];
		const absolutePatternList = patternList.map((currentPattern) => path.resolve(cwd, currentPattern));
		const patternRoots = new Set(absolutePatternList.map((currentPattern) => path.parse(currentPattern).root));
		if (patternRoots.size > 1) {
			throw new Error(`Glob patterns must resolve under a single filesystem root. Received: ${patternList.join(', ')}`);
		}

		const patternRoot = absolutePatternList.length > 0 ? path.parse(absolutePatternList[0]).root : cwd;
		const relativePatternList = absolutePatternList.map((currentPattern) => normaliseGlobSeparators(path.relative(patternRoot, currentPattern)));
		const filePaths = await fastGlob(relativePatternList, {
			absolute: true,
			cwd: patternRoot,
			ignore: DEFAULT_IGNORE_PATTERNS,
			onlyFiles: true,
			unique: true
		});

		if (filePaths.length === 0) {
			throw new Error(`No JavaScript files matched ${JSON.stringify(pattern)} from ${cwd}.`);
		}

		const detectedFeatureNames = new Set();
		const featuresByFilePath = new Map();
		const fileCountsByFeature = new Map();
		const warnings = [];

		for (const filePath of filePaths.sort()) {
			const fileAnalysis = await this.#analyseFile({
				availableFeatureNames,
				cwd,
				filePath
			});

			if (fileAnalysis.warning) {
				warnings.push(fileAnalysis.warning);
			}

			const detectedFeaturesForFile = fileAnalysis.detectedFeatures;

			if (!detectedFeaturesForFile || detectedFeaturesForFile.size === 0) {
				continue;
			}

			featuresByFilePath.set(filePath, new Set(detectedFeaturesForFile));
			for (const featureName of detectedFeaturesForFile) {
				detectedFeatureNames.add(featureName);
				fileCountsByFeature.set(featureName, (fileCountsByFeature.get(featureName) ?? 0) + 1);
			}
		}

		return {
			targetVersion: versionData.targetVersion,
			detectedFeatures: Array.from(detectedFeatureNames).sort(),
			featuresByFilePath,
			fileCountsByFeature,
			warnings,
			matchedFileCount: filePaths.length
		};
	}

	/**
	 * Analyse one matched file in isolation so a single bad input does not abort the whole scan.
	 *
	 * @param {object} options
	 * @param {Set<string>} options.availableFeatureNames
	 * @param {string} options.cwd
	 * @param {string} options.filePath
	 * @returns {Promise<{ detectedFeatures: Set<string> | null, warning: string | null }>}
	 */
	async #analyseFile({ availableFeatureNames, cwd, filePath }) {
		const displayFilePath = getDisplayFilePath({ cwd, filePath });
		const fileExtension = path.extname(filePath).toLowerCase();

		if (fileExtension && !JAVASCRIPT_FILE_EXTENSIONS.has(fileExtension)) {
			return {
				detectedFeatures: null,
				warning: `Skipped non-JavaScript file ${displayFilePath}.`
			};
		}

		try {
			const sourceText = await fs.readFile(filePath, 'utf8');
			const analyser = new JavaScriptFileAnalyser({
				availableFeatureNames,
				featureByExactChain: this.featureByExactChain,
				featuresByGlobalRuntimeName: this.featuresByGlobalRuntimeName,
				instanceDefinitionsByPropertyName: this.instanceDefinitionsByPropertyName,
				iterationSyntaxDefinitions: this.iterationSyntaxDefinitions
			});

			return {
				detectedFeatures: analyser.analyseFile({ filePath, sourceText }),
				warning: null
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return {
				detectedFeatures: null,
				warning: `Skipped file ${displayFilePath}: ${message}`
			};
		}
	}
}

/**
 * Convenience wrapper for one-off analysis.
 *
 * @param {object} options
 * @returns {Promise<object>}
 */
export async function analysePolyfills(options) {
	const scanner = new PolyfillScanner();
	return scanner.analyse(options);
}

export const analyzePolyfills = analysePolyfills;

function normaliseGlobSeparators(pattern) {
	return pattern.split(path.sep).join('/');
}

function getDisplayFilePath({ cwd, filePath }) {
	return normaliseGlobSeparators(path.relative(cwd, filePath) || filePath);
}
