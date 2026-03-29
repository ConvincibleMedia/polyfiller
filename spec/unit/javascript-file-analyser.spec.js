import test from 'node:test';
import assert from 'node:assert/strict';
import { JavaScriptFileAnalyser } from '../../src/detection/javascript-file-analyser.js';
import { EXACT_CHAIN_FEATURE_DEFINITIONS, GLOBAL_IDENTIFIER_FEATURE_DEFINITIONS, INSTANCE_MEMBER_FEATURE_DEFINITIONS, ITERATION_SYNTAX_FEATURE_DEFINITIONS } from '../../src/detection/feature-catalogue.js';
import { VersionedPolyfillRegistry } from '../../src/core/versioned-polyfill-registry.js';

/**
 * Build an analyser with the repository's real detector catalogue so unit tests stay aligned with production rules.
 *
 * @returns {Promise<JavaScriptFileAnalyser>}
 */
async function createAnalyser() {
	const registry = new VersionedPolyfillRegistry();
	const { availableFeatures } = await registry.getVersionData({ targetVersion: '4.8.0' });
	const featureByExactChain = new Map(EXACT_CHAIN_FEATURE_DEFINITIONS.map((definition) => [definition.chain.join('.'), definition.featureName]));
	const featuresByGlobalRuntimeName = new Map();
	const instanceDefinitionsByPropertyName = new Map();

	for (const definition of GLOBAL_IDENTIFIER_FEATURE_DEFINITIONS) {
		const featureNames = featuresByGlobalRuntimeName.get(definition.runtimeName) ?? [];
		featureNames.push(definition.featureName);
		featuresByGlobalRuntimeName.set(definition.runtimeName, featureNames);
	}

	for (const definition of INSTANCE_MEMBER_FEATURE_DEFINITIONS) {
		const definitions = instanceDefinitionsByPropertyName.get(definition.propertyName) ?? [];
		definitions.push(definition);
		instanceDefinitionsByPropertyName.set(definition.propertyName, definitions);
	}

	return new JavaScriptFileAnalyser({
		availableFeatureNames: new Set(availableFeatures),
		featureByExactChain,
		featuresByGlobalRuntimeName,
		instanceDefinitionsByPropertyName,
		iterationSyntaxDefinitions: ITERATION_SYNTAX_FEATURE_DEFINITIONS
	});
}

/**
 * Analyse one virtual source file and return a sorted feature list for concise assertions.
 *
 * @param {object} options
 * @param {string} options.filePath
 * @param {string} options.sourceText
 * @returns {Promise<string[]>}
 */
async function detectFeatureNames({ filePath, sourceText }) {
	const analyser = await createAnalyser();
	return Array.from(analyser.analyseFile({ filePath, sourceText })).sort();
}

test('JavaScriptFileAnalyser still detects exact chains reached through global containers', async () => {
	const detectedFeatureNames = await detectFeatureNames({
		filePath: '/virtual/global-containers.js',
		sourceText: [
			'window.Promise.any([]);',
			'self.fetch("/api");',
			'globalThis.Object.assign({}, {});'
		].join('\n')
	});

	assert.deepEqual(detectedFeatureNames, [
		'Object.assign',
		'Promise',
		'Promise.any',
		'fetch',
		'globalThis'
	]);
});

test('JavaScriptFileAnalyser ignores exact-chain lookups on shadowed bindings', async () => {
	const detectedFeatureNames = await detectFeatureNames({
		filePath: '/virtual/shadowed-globals.js',
		sourceText: [
			'export function buildLocalRuntime({ Promise, document, Intl }) {',
			'\tconst Object = { assign() {} };',
			'\tconst URL = class UrlMock { toJSON() { return "mock"; } };',
			'\tPromise.any([]);',
			'\tdocument.querySelector(".card");',
			'\tObject.assign({}, {});',
			'\tnew URL("/local", "https://example.com").toJSON();',
			'\tnew Intl.RelativeTimeFormat("en-GB");',
			'}'
		].join('\n')
	});

	assert.deepEqual(detectedFeatureNames, []);
});

test('JavaScriptFileAnalyser detects realistic dashboard and export workflow features', async () => {
	const detectedFeatureNames = await detectFeatureNames({
		filePath: '/virtual/report-dashboard.js',
		sourceText: [
			'const reportCards = document.querySelectorAll(".report-card");',
			'reportCards.forEach(() => {});',
			'for (const reportCardNode of reportCards) {',
			'\tbreak;',
			'}',
			'const firstReportCard = document.querySelector(".report-card");',
			'firstReportCard.classList.forEach(() => {});',
			'for (const className of firstReportCard.classList) {',
			'\tfirstReportCard.classList.replace("is-stale", className);',
			'\tbreak;',
			'}',
			'const dashboardToggleTarget = firstReportCard.closest(".report-grid");',
			'dashboardToggleTarget.toggleAttribute("data-busy", true);',
			'firstReportCard.dataset.route = String(firstReportCard.dataset.route).replaceAll("-", "/");',
			'const flattenedRouteNames = Array.from(reportCards).flatMap(() => ["daily/report"]);',
			'const routeSummary = Object.fromEntries([["hasDailyReport", Array.from(reportCards).includes(firstReportCard)]]);',
			'const dashboardPanel = document.createElement("section");',
			'const dashboardChildren = dashboardPanel.children;',
			'for (const dashboardChild of dashboardChildren) {',
			'\tbreak;',
			'}',
			'const filterForm = document.createElement("form");',
			'filterForm.requestSubmit();',
			'const startDateInput = document.createElement("input");',
			'startDateInput.valueAsDate = new Date("2026-03-29T00:00:00.000Z");',
			'const teamSelect = document.createElement("select");',
			'teamSelect.selectedOptions;',
			'const chartCanvas = document.createElement("canvas");',
			'chartCanvas.toBlob(() => {});',
			'const liveRegionText = document.createTextNode("Loading report filters");',
			'liveRegionText.replaceWith("Report filters ready");',
			'const liveRegion = document.createDocumentFragment();',
			'liveRegion.replaceChildren(liveRegionText);',
			'const exportUrl = new URL("/api/reports/export", "https://example.com");',
			'const exportHeaders = new Uint8Array([0x50, 0x4b]);',
			'const headerIterator = exportHeaders[Symbol.iterator]();',
			'headerIterator.next();',
			'window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {});',
			'Promise.allSettled([fetch(exportUrl.toJSON()), Promise.resolve(routeSummary)]).finally(() => liveRegion.replaceChildren("done"));',
			'new Error("Could not queue the export", { cause: exportHeaders });',
			'window.addEventListener("hashchange", () => {});'
		].join('\n')
	});

	assert.deepEqual(detectedFeatureNames, [
		'Array.from',
		'Array.prototype.flatMap',
		'Array.prototype.includes',
		'ArrayBuffer',
		'CharacterData.prototype.replaceWith',
		'DOMTokenList.prototype.@@iterator',
		'DOMTokenList.prototype.forEach',
		'DOMTokenList.prototype.replace',
		'DocumentFragment.prototype.replaceChildren',
		'Element.prototype.classList',
		'Element.prototype.closest',
		'Element.prototype.dataset',
		'Element.prototype.toggleAttribute',
		'Error.cause',
		'Event.hashchange',
		'HTMLCanvasElement.prototype.toBlob',
		'HTMLCollection.prototype.@@iterator',
		'HTMLFormElement.prototype.requestSubmit',
		'HTMLInputElement.prototype.valueAsDate',
		'HTMLSelectElement.prototype.selectedOptions',
		'MediaQueryList.prototype.addEventListener',
		'NodeList.prototype.@@iterator',
		'NodeList.prototype.forEach',
		'Object.fromEntries',
		'Promise',
		'Promise.allSettled',
		'Promise.prototype.finally',
		'String.prototype.replaceAll',
		'Symbol',
		'Symbol.iterator',
		'TypedArray.prototype.@@iterator',
		'URL',
		'URL.prototype.toJSON',
		'fetch',
		'matchMedia'
	]);
});

test('JavaScriptFileAnalyser ignores commented-out code and dynamic property lookups that are not statically knowable', async () => {
	const detectedFeatureNames = await detectFeatureNames({
		filePath: '/virtual/commented-decoys.js',
		sourceText: [
			'const runtimeStub = {',
			'\trequest: { whenReady() {} },',
			'\treportCard: { classList: { replace() {} }, dataset: {} }',
			'};',
			'const getDynamicPropertyName = () => "whenReady";',
			'runtimeStub.request[getDynamicPropertyName()]?.();',
			'runtimeStub.reportCard[getDynamicPropertyName()];',
			'const embeddedExample = `',
			'Promise.any([fetch("/api/export")]);',
			'new URL("/api/export", "https://example.com").toJSON();',
			'`;',
			'const previewPanel = <aside>{/* Promise.any([fetch("/api/export")]); */}</aside>;',
			'/*',
			'\twindow.addEventListener("hashchange", () => {});',
			'\tfor (const reportCard of document.querySelectorAll(".report-card")) {',
			'\t\treportCard.classList.replace("is-stale", "is-ready");',
			'\t}',
			'\tnew Error("Could not save report", { cause: previousError });',
			'*/'
		].join('\n')
	});

	assert.deepEqual(detectedFeatureNames, []);
});

test('JavaScriptFileAnalyser detects async and iterator syntax features from realistic queue and byte-stream code', async () => {
	const detectedFeatureNames = await detectFeatureNames({
		filePath: '/virtual/job-queue.js',
		sourceText: [
			'async function* streamJobUpdates(jobQueue) {',
			'\tfor await (const jobUpdate of jobQueue) {',
			'\t\tyield* `job:${jobUpdate.type ?? "unknown"}`;',
			'\t}',
			'}',
			'const headerBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);',
			'const headerIterator = headerBytes[Symbol.iterator]();',
			'headerIterator.next();',
			'const [firstHeaderByte] = headerBytes;',
			'let previewHeaderByte;',
			'[previewHeaderByte] = headerBytes;',
			'const copiedHeaderBytes = [...headerBytes];'
		].join('\n')
	});

	assert.deepEqual(detectedFeatureNames, [
		'ArrayBuffer',
		'String.prototype.@@iterator',
		'Symbol',
		'Symbol.asyncIterator',
		'Symbol.iterator',
		'TypedArray.prototype.@@iterator'
	]);
});
