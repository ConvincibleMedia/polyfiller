import fs from 'node:fs/promises';
import path from 'node:path';
import fastGlobModule from 'fast-glob';
import { JavaScriptFileAnalyser } from '../detection/javascript-file-analyser.js';
import { DETECTABLE_FEATURE_NAMES, EXACT_CHAIN_FEATURE_DEFINITIONS, GLOBAL_IDENTIFIER_FEATURE_DEFINITIONS, INSTANCE_MEMBER_FEATURE_DEFINITIONS, ITERATION_SYNTAX_FEATURE_DEFINITIONS } from '../detection/feature-catalogue.js';
import { MANUAL_FEATURE_NAMES } from '../detection/manual-feature-catalogue.js';
import { VersionedPolyfillRegistry } from './versioned-polyfill-registry.js';

const fastGlob = fastGlobModule.default ?? fastGlobModule;
const DEFAULT_IGNORE_PATTERNS = ['**/old/**', '**/test/**', '**/tmp/**'];

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
		const manualCheckFeatures = versionData.availableFeatures.filter((featureName) => MANUAL_FEATURE_NAMES.has(featureName)).sort();
		const undetectedFeatureNames = versionData.availableFeatures
			.filter((featureName) => !MANUAL_FEATURE_NAMES.has(featureName))
			.filter((featureName) => !DETECTABLE_FEATURE_NAMES.has(featureName));

		if (undetectedFeatureNames.length > 0) {
			throw new Error(`The feature catalogue does not cover these polyfills for ${versionData.targetVersion}: ${undetectedFeatureNames.join(', ')}`);
		}

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

		for (const filePath of filePaths.sort()) {
			const sourceText = await fs.readFile(filePath, 'utf8');
			const analyser = new JavaScriptFileAnalyser({
				availableFeatureNames,
				featureByExactChain: this.featureByExactChain,
				featuresByGlobalRuntimeName: this.featuresByGlobalRuntimeName,
				instanceDefinitionsByPropertyName: this.instanceDefinitionsByPropertyName,
				iterationSyntaxDefinitions: this.iterationSyntaxDefinitions
			});
			const detectedFeaturesForFile = analyser.analyseFile({ filePath, sourceText });

			if (detectedFeaturesForFile.size === 0) {
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
			manualCheckFeatures,
			matchedFileCount: filePaths.length
		};
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
