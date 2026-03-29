const globalIdentifierDefinitions = createGlobalIdentifierDefinitions([
	['AbortController', 'AbortController'],
	['AggregateError', 'AggregateError'],
	['ArrayBuffer', 'ArrayBuffer'],
	['AudioContext', 'AudioContext'],
	['Blob', 'Blob'],
	['CustomEvent', 'CustomEvent'],
	['DOMRect', 'DOMRect'],
	['DOMTokenList', 'DOMTokenList'],
	['DocumentFragment', 'DocumentFragment'],
	['Element', 'Element'],
	['Event', 'Event'],
	['EventSource', 'EventSource'],
	['fetch', 'fetch'],
	['getComputedStyle', 'getComputedStyle'],
	['globalThis', 'globalThis'],
	['HTMLDocument', 'HTMLDocument'],
	['IntersectionObserver', 'IntersectionObserver'],
	['IntersectionObserverEntry', 'IntersectionObserverEntry'],
	['JSON', 'JSON'],
	['localStorage', 'localStorage'],
	['Map', 'Map'],
	['matchMedia', 'matchMedia'],
	['MutationObserver', 'MutationObserver'],
	['Promise', 'Promise'],
	['queueMicrotask', 'queueMicrotask'],
	['Reflect', 'Reflect'],
	['requestAnimationFrame', 'requestAnimationFrame'],
	['requestIdleCallback', 'requestIdleCallback'],
	['ResizeObserver', 'ResizeObserver'],
	['Set', 'Set'],
	['setImmediate', 'setImmediate'],
	['structuredClone', 'structuredClone'],
	['Symbol', 'Symbol'],
	['TextEncoder', 'TextEncoder'],
	['URL', 'URL'],
	['WeakMap', 'WeakMap'],
	['WeakSet', 'WeakSet'],
	['window', 'Window'],
	['Window', 'Window'],
	['XMLHttpRequest', 'XMLHttpRequest'],
	['atob', 'atob'],
	['console', 'console'],
	['devicePixelRatio', 'devicePixelRatio'],
	['document', 'document'],
	['Int8Array', 'ArrayBuffer'],
	['Uint8Array', 'ArrayBuffer'],
	['Uint8ClampedArray', 'ArrayBuffer'],
	['Int16Array', 'ArrayBuffer'],
	['Uint16Array', 'ArrayBuffer'],
	['Int32Array', 'ArrayBuffer'],
	['Uint32Array', 'ArrayBuffer'],
	['Float32Array', 'ArrayBuffer'],
	['Float64Array', 'ArrayBuffer'],
	['DataView', 'ArrayBuffer']
]);

const exactChainDefinitions = [
	...createExactChainDefinitions('Array', {
		from: 'Array.from',
		isArray: 'Array.isArray',
		of: 'Array.of'
	}),
	...createExactChainDefinitions('ArrayBuffer', {
		isView: 'ArrayBuffer.isView'
	}),
	...createExactChainDefinitions('CSS', {
		supports: 'CSS.supports'
	}),
	...createExactChainDefinitions('DOMRect', {
		fromRect: 'DOMRect.fromRect'
	}),
	...createExactChainDefinitions('Date', {
		now: 'Date.now'
	}),
	...createExactChainDefinitions('Intl', {
		DateTimeFormat: 'Intl.DateTimeFormat',
		DisplayNames: 'Intl.DisplayNames',
		ListFormat: 'Intl.ListFormat',
		Locale: 'Intl.Locale',
		NumberFormat: 'Intl.NumberFormat',
		PluralRules: 'Intl.PluralRules',
		RelativeTimeFormat: 'Intl.RelativeTimeFormat',
		getCanonicalLocales: 'Intl.getCanonicalLocales'
	}),
	...createExactChainDefinitions('Math', {
		acosh: 'Math.acosh',
		asinh: 'Math.asinh',
		atanh: 'Math.atanh',
		cbrt: 'Math.cbrt',
		clz32: 'Math.clz32',
		cosh: 'Math.cosh',
		expm1: 'Math.expm1',
		fround: 'Math.fround',
		hypot: 'Math.hypot',
		imul: 'Math.imul',
		log10: 'Math.log10',
		log1p: 'Math.log1p',
		log2: 'Math.log2',
		sign: 'Math.sign',
		sinh: 'Math.sinh',
		tanh: 'Math.tanh',
		trunc: 'Math.trunc'
	}),
	...createExactChainDefinitions('Number', {
		EPSILON: 'Number.Epsilon',
		MAX_SAFE_INTEGER: 'Number.MAX_SAFE_INTEGER',
		MIN_SAFE_INTEGER: 'Number.MIN_SAFE_INTEGER',
		isFinite: 'Number.isFinite',
		isInteger: 'Number.isInteger',
		isNaN: 'Number.isNaN',
		isSafeInteger: 'Number.isSafeInteger',
		parseFloat: 'Number.parseFloat',
		parseInt: 'Number.parseInt'
	}),
	...createExactChainDefinitions('Object', {
		assign: 'Object.assign',
		create: 'Object.create',
		defineProperties: 'Object.defineProperties',
		defineProperty: 'Object.defineProperty',
		entries: 'Object.entries',
		freeze: 'Object.freeze',
		fromEntries: 'Object.fromEntries',
		getOwnPropertyDescriptor: 'Object.getOwnPropertyDescriptor',
		getOwnPropertyDescriptors: 'Object.getOwnPropertyDescriptors',
		getOwnPropertyNames: 'Object.getOwnPropertyNames',
		getPrototypeOf: 'Object.getPrototypeOf',
		hasOwn: 'Object.hasOwn',
		is: 'Object.is',
		isExtensible: 'Object.isExtensible',
		isFrozen: 'Object.isFrozen',
		isSealed: 'Object.isSealed',
		keys: 'Object.keys',
		preventExtensions: 'Object.preventExtensions',
		seal: 'Object.seal',
		setPrototypeOf: 'Object.setPrototypeOf',
		values: 'Object.values'
	}),
	{ chain: ['Object', 'prototype', 'toString'], featureName: 'Object.prototype.toString' },
	...createExactChainDefinitions('Promise', {
		allSettled: 'Promise.allSettled',
		any: 'Promise.any'
	}),
	...createExactChainDefinitions('Reflect', {
		apply: 'Reflect.apply',
		construct: 'Reflect.construct',
		defineProperty: 'Reflect.defineProperty',
		deleteProperty: 'Reflect.deleteProperty',
		get: 'Reflect.get',
		getOwnPropertyDescriptor: 'Reflect.getOwnPropertyDescriptor',
		getPrototypeOf: 'Reflect.getPrototypeOf',
		has: 'Reflect.has',
		isExtensible: 'Reflect.isExtensible',
		ownKeys: 'Reflect.ownKeys',
		preventExtensions: 'Reflect.preventExtensions',
		set: 'Reflect.set',
		setPrototypeOf: 'Reflect.setPrototypeOf'
	}),
	...createExactChainDefinitions('String', {
		fromCodePoint: 'String.fromCodePoint',
		raw: 'String.raw'
	}),
	...createExactChainDefinitions('Symbol', {
		asyncIterator: 'Symbol.asyncIterator',
		hasInstance: 'Symbol.hasInstance',
		isConcatSpreadable: 'Symbol.isConcatSpreadable',
		iterator: 'Symbol.iterator',
		match: 'Symbol.match',
		matchAll: 'Symbol.matchAll',
		replace: 'Symbol.replace',
		search: 'Symbol.search',
		species: 'Symbol.species',
		split: 'Symbol.split',
		toPrimitive: 'Symbol.toPrimitive',
		toStringTag: 'Symbol.toStringTag',
		unscopables: 'Symbol.unscopables'
	}),
	...createExactChainDefinitions('console', {
		assert: 'console.assert',
		clear: 'console.clear',
		count: 'console.count',
		debug: 'console.debug',
		dir: 'console.dir',
		dirxml: 'console.dirxml',
		error: 'console.error',
		exception: 'console.exception',
		group: 'console.group',
		groupCollapsed: 'console.groupCollapsed',
		groupEnd: 'console.groupEnd',
		info: 'console.info',
		log: 'console.log',
		markTimeline: 'console.markTimeline',
		profile: 'console.profile',
		profileEnd: 'console.profileEnd',
		profiles: 'console.profiles',
		table: 'console.table',
		time: 'console.time',
		timeEnd: 'console.timeEnd',
		timeStamp: 'console.timeStamp',
		timeline: 'console.timeline',
		timelineEnd: 'console.timelineEnd',
		trace: 'console.trace',
		warn: 'console.warn'
	}),
	...createExactChainDefinitions('document', {
		currentScript: 'document.currentScript',
		elementsFromPoint: 'document.elementsFromPoint',
		getElementsByClassName: 'document.getElementsByClassName',
		head: 'document.head',
		querySelector: 'document.querySelector',
		visibilityState: 'document.visibilityState'
	}),
	...createExactChainDefinitions('location', {
		origin: 'location.origin'
	}),
	...createExactChainDefinitions('navigator', {
		geolocation: 'navigator.geolocation',
		sendBeacon: 'navigator.sendBeacon'
	}),
	...createExactChainDefinitions('performance', {
		now: 'performance.now'
	}),
	...createExactChainDefinitions('screen', {
		orientation: 'screen.orientation'
	}),
	...createPrototypeChainDefinitions('Array', {
		'@@iterator': 'Array.prototype.@@iterator',
		at: 'Array.prototype.at',
		copyWithin: 'Array.prototype.copyWithin',
		entries: 'Array.prototype.entries',
		fill: 'Array.prototype.fill',
		find: 'Array.prototype.find',
		findIndex: 'Array.prototype.findIndex',
		findLast: 'Array.prototype.findLast',
		findLastIndex: 'Array.prototype.findLastIndex',
		flat: 'Array.prototype.flat',
		flatMap: 'Array.prototype.flatMap',
		forEach: 'Array.prototype.forEach',
		includes: 'Array.prototype.includes',
		indexOf: 'Array.prototype.indexOf',
		keys: 'Array.prototype.keys',
		lastIndexOf: 'Array.prototype.lastIndexOf',
		map: 'Array.prototype.map',
		reduce: 'Array.prototype.reduce',
		reduceRight: 'Array.prototype.reduceRight',
		some: 'Array.prototype.some',
		sort: 'Array.prototype.sort',
		values: 'Array.prototype.values',
		toReversed: 'Array.prototype.toReversed',
		toSorted: 'Array.prototype.toSorted',
		toSpliced: 'Array.prototype.toSpliced',
		with: 'Array.prototype.with',
		every: 'Array.prototype.every',
		filter: 'Array.prototype.filter'
	}),
	...createPrototypeChainDefinitions('ArrayBuffer', {
		'@@toStringTag': 'ArrayBuffer.prototype.@@toStringTag'
	}),
	...createPrototypeChainDefinitions('CharacterData', {
		after: 'CharacterData.prototype.after',
		before: 'CharacterData.prototype.before',
		nextElementSibling: 'CharacterData.prototype.nextElementSibling',
		previousElementSibling: 'CharacterData.prototype.previousElementSibling',
		remove: 'CharacterData.prototype.remove',
		replaceWith: 'CharacterData.prototype.replaceWith'
	}),
	...createPrototypeChainDefinitions('Date', {
		toISOString: 'Date.prototype.toISOString'
	}),
	...createPrototypeChainDefinitions('DOMTokenList', {
		'@@iterator': 'DOMTokenList.prototype.@@iterator',
		forEach: 'DOMTokenList.prototype.forEach',
		replace: 'DOMTokenList.prototype.replace'
	}),
	...createPrototypeChainDefinitions('DocumentFragment', {
		append: 'DocumentFragment.prototype.append',
		prepend: 'DocumentFragment.prototype.prepend',
		replaceChildren: 'DocumentFragment.prototype.replaceChildren'
	}),
	...createPrototypeChainDefinitions('Element', {
		after: 'Element.prototype.after',
		append: 'Element.prototype.append',
		before: 'Element.prototype.before',
		classList: 'Element.prototype.classList',
		cloneNode: 'Element.prototype.cloneNode',
		closest: 'Element.prototype.closest',
		dataset: 'Element.prototype.dataset',
		getAttributeNames: 'Element.prototype.getAttributeNames',
		matches: 'Element.prototype.matches',
		nextElementSibling: 'Element.prototype.nextElementSibling',
		prepend: 'Element.prototype.prepend',
		previousElementSibling: 'Element.prototype.previousElementSibling',
		remove: 'Element.prototype.remove',
		replaceChildren: 'Element.prototype.replaceChildren',
		replaceWith: 'Element.prototype.replaceWith',
		toggleAttribute: 'Element.prototype.toggleAttribute'
	}),
	...createPrototypeChainDefinitions('Function', {
		bind: 'Function.prototype.bind',
		name: 'Function.prototype.name'
	}),
	...createPrototypeChainDefinitions('HTMLCanvasElement', {
		toBlob: 'HTMLCanvasElement.prototype.toBlob'
	}),
	...createPrototypeChainDefinitions('HTMLCollection', {
		'@@iterator': 'HTMLCollection.prototype.@@iterator'
	}),
	...createPrototypeChainDefinitions('HTMLFormElement', {
		requestSubmit: 'HTMLFormElement.prototype.requestSubmit'
	}),
	...createPrototypeChainDefinitions('HTMLInputElement', {
		valueAsDate: 'HTMLInputElement.prototype.valueAsDate'
	}),
	...createPrototypeChainDefinitions('HTMLSelectElement', {
		selectedOptions: 'HTMLSelectElement.prototype.selectedOptions'
	}),
	...createPrototypeChainDefinitions('MediaQueryList', {
		addEventListener: 'MediaQueryList.prototype.addEventListener'
	}),
	...createPrototypeChainDefinitions('Node', {
		contains: 'Node.prototype.contains',
		getRootNode: 'Node.prototype.getRootNode',
		isConnected: 'Node.prototype.isConnected',
		isSameNode: 'Node.prototype.isSameNode'
	}),
	...createPrototypeChainDefinitions('NodeList', {
		'@@iterator': 'NodeList.prototype.@@iterator',
		forEach: 'NodeList.prototype.forEach'
	}),
	...createPrototypeChainDefinitions('Promise', {
		finally: 'Promise.prototype.finally'
	}),
	...createPrototypeChainDefinitions('RegExp', {
		'@@matchAll': 'RegExp.prototype.@@matchAll',
		flags: 'RegExp.prototype.flags'
	}),
	...createPrototypeChainDefinitions('String', {
		'@@iterator': 'String.prototype.@@iterator',
		anchor: 'String.prototype.anchor',
		at: 'String.prototype.at',
		big: 'String.prototype.big',
		blink: 'String.prototype.blink',
		bold: 'String.prototype.bold',
		codePointAt: 'String.prototype.codePointAt',
		endsWith: 'String.prototype.endsWith',
		fixed: 'String.prototype.fixed',
		fontcolor: 'String.prototype.fontcolor',
		fontsize: 'String.prototype.fontsize',
		includes: 'String.prototype.includes',
		italics: 'String.prototype.italics',
		link: 'String.prototype.link',
		matchAll: 'String.prototype.matchAll',
		normalize: 'String.prototype.normalize',
		padEnd: 'String.prototype.padEnd',
		padStart: 'String.prototype.padStart',
		repeat: 'String.prototype.repeat',
		replaceAll: 'String.prototype.replaceAll',
		small: 'String.prototype.small',
		startsWith: 'String.prototype.startsWith',
		strike: 'String.prototype.strike',
		sub: 'String.prototype.sub',
		sup: 'String.prototype.sup',
		trim: 'String.prototype.trim',
		trimEnd: 'String.prototype.trimEnd',
		trimStart: 'String.prototype.trimStart'
	}),
	...createPrototypeChainDefinitions('Symbol', {
		description: 'Symbol.prototype.description'
	}),
	...createPrototypeChainDefinitions('URL', {
		toJSON: 'URL.prototype.toJSON'
	})
];

const instanceMemberDefinitions = [
	...createInstanceMemberDefinitions(['array'], {
		'@@iterator': 'Array.prototype.@@iterator',
		at: 'Array.prototype.at',
		copyWithin: 'Array.prototype.copyWithin',
		entries: 'Array.prototype.entries',
		every: 'Array.prototype.every',
		fill: 'Array.prototype.fill',
		filter: 'Array.prototype.filter',
		find: 'Array.prototype.find',
		findIndex: 'Array.prototype.findIndex',
		findLast: 'Array.prototype.findLast',
		findLastIndex: 'Array.prototype.findLastIndex',
		flat: 'Array.prototype.flat',
		flatMap: 'Array.prototype.flatMap',
		forEach: 'Array.prototype.forEach',
		includes: 'Array.prototype.includes',
		indexOf: 'Array.prototype.indexOf',
		keys: 'Array.prototype.keys',
		lastIndexOf: 'Array.prototype.lastIndexOf',
		map: 'Array.prototype.map',
		reduce: 'Array.prototype.reduce',
		reduceRight: 'Array.prototype.reduceRight',
		some: 'Array.prototype.some',
		sort: 'Array.prototype.sort',
		toReversed: 'Array.prototype.toReversed',
		toSorted: 'Array.prototype.toSorted',
		toSpliced: 'Array.prototype.toSpliced',
		values: 'Array.prototype.values',
		with: 'Array.prototype.with'
	}),
	...createInstanceMemberDefinitions(['array-buffer'], {
		'@@toStringTag': 'ArrayBuffer.prototype.@@toStringTag'
	}),
	...createInstanceMemberDefinitions(['character-data'], {
		after: 'CharacterData.prototype.after',
		before: 'CharacterData.prototype.before',
		nextElementSibling: 'CharacterData.prototype.nextElementSibling',
		previousElementSibling: 'CharacterData.prototype.previousElementSibling',
		remove: 'CharacterData.prototype.remove',
		replaceWith: 'CharacterData.prototype.replaceWith'
	}),
	...createInstanceMemberDefinitions(['date'], {
		toISOString: 'Date.prototype.toISOString'
	}),
	...createInstanceMemberDefinitions(['dom-token-list'], {
		'@@iterator': 'DOMTokenList.prototype.@@iterator',
		forEach: 'DOMTokenList.prototype.forEach',
		replace: 'DOMTokenList.prototype.replace'
	}),
	...createInstanceMemberDefinitions(['document-fragment'], {
		append: 'DocumentFragment.prototype.append',
		prepend: 'DocumentFragment.prototype.prepend',
		replaceChildren: 'DocumentFragment.prototype.replaceChildren'
	}),
	...createInstanceMemberDefinitions(['element'], {
		after: 'Element.prototype.after',
		append: 'Element.prototype.append',
		before: 'Element.prototype.before',
		classList: 'Element.prototype.classList',
		cloneNode: 'Element.prototype.cloneNode',
		closest: 'Element.prototype.closest',
		dataset: 'Element.prototype.dataset',
		getAttributeNames: 'Element.prototype.getAttributeNames',
		matches: 'Element.prototype.matches',
		nextElementSibling: 'Element.prototype.nextElementSibling',
		prepend: 'Element.prototype.prepend',
		previousElementSibling: 'Element.prototype.previousElementSibling',
		remove: 'Element.prototype.remove',
		replaceChildren: 'Element.prototype.replaceChildren',
		replaceWith: 'Element.prototype.replaceWith',
		toggleAttribute: 'Element.prototype.toggleAttribute'
	}),
	...createInstanceMemberDefinitions(['function'], {
		bind: 'Function.prototype.bind',
		name: 'Function.prototype.name'
	}),
	...createInstanceMemberDefinitions(['html-canvas-element'], {
		toBlob: 'HTMLCanvasElement.prototype.toBlob'
	}),
	...createInstanceMemberDefinitions(['html-collection'], {
		'@@iterator': 'HTMLCollection.prototype.@@iterator'
	}),
	...createInstanceMemberDefinitions(['html-form-element'], {
		requestSubmit: 'HTMLFormElement.prototype.requestSubmit'
	}),
	...createInstanceMemberDefinitions(['html-input-element'], {
		valueAsDate: 'HTMLInputElement.prototype.valueAsDate'
	}),
	...createInstanceMemberDefinitions(['html-select-element'], {
		selectedOptions: 'HTMLSelectElement.prototype.selectedOptions'
	}),
	...createInstanceMemberDefinitions(['media-query-list'], {
		addEventListener: 'MediaQueryList.prototype.addEventListener'
	}),
	...createInstanceMemberDefinitions(['node'], {
		contains: 'Node.prototype.contains',
		getRootNode: 'Node.prototype.getRootNode',
		isConnected: 'Node.prototype.isConnected',
		isSameNode: 'Node.prototype.isSameNode'
	}),
	...createInstanceMemberDefinitions(['node-list'], {
		'@@iterator': 'NodeList.prototype.@@iterator',
		forEach: 'NodeList.prototype.forEach'
	}),
	...createInstanceMemberDefinitions(['promise'], {
		finally: 'Promise.prototype.finally'
	}),
	...createInstanceMemberDefinitions(['regexp'], {
		'@@matchAll': 'RegExp.prototype.@@matchAll',
		flags: 'RegExp.prototype.flags'
	}),
	...createInstanceMemberDefinitions(['string'], {
		'@@iterator': 'String.prototype.@@iterator',
		anchor: 'String.prototype.anchor',
		at: 'String.prototype.at',
		big: 'String.prototype.big',
		blink: 'String.prototype.blink',
		bold: 'String.prototype.bold',
		codePointAt: 'String.prototype.codePointAt',
		endsWith: 'String.prototype.endsWith',
		fixed: 'String.prototype.fixed',
		fontcolor: 'String.prototype.fontcolor',
		fontsize: 'String.prototype.fontsize',
		includes: 'String.prototype.includes',
		italics: 'String.prototype.italics',
		link: 'String.prototype.link',
		matchAll: 'String.prototype.matchAll',
		normalize: 'String.prototype.normalize',
		padEnd: 'String.prototype.padEnd',
		padStart: 'String.prototype.padStart',
		repeat: 'String.prototype.repeat',
		replaceAll: 'String.prototype.replaceAll',
		small: 'String.prototype.small',
		startsWith: 'String.prototype.startsWith',
		strike: 'String.prototype.strike',
		sub: 'String.prototype.sub',
		sup: 'String.prototype.sup',
		trim: 'String.prototype.trim',
		trimEnd: 'String.prototype.trimEnd',
		trimStart: 'String.prototype.trimStart'
	}),
	...createInstanceMemberDefinitions(['symbol'], {
		description: 'Symbol.prototype.description'
	}),
	...createInstanceMemberDefinitions(['typed-array'], {
		'@@iterator': 'TypedArray.prototype.@@iterator',
		'@@toStringTag': 'TypedArray.prototype.@@toStringTag',
		at: 'TypedArray.prototype.at',
		entries: 'TypedArray.prototype.entries',
		findLast: 'TypedArray.prototype.findLast',
		findLastIndex: 'TypedArray.prototype.findLastIndex',
		keys: 'TypedArray.prototype.keys',
		sort: 'TypedArray.prototype.sort',
		toLocaleString: 'TypedArray.prototype.toLocaleString',
		toReversed: 'TypedArray.prototype.toReversed',
		toSorted: 'TypedArray.prototype.toSorted',
		toString: 'TypedArray.prototype.toString',
		values: 'TypedArray.prototype.values',
		with: 'TypedArray.prototype.with'
	}),
	...createInstanceMemberDefinitions(['url'], {
		toJSON: 'URL.prototype.toJSON'
	})
];

const iterationSyntaxDefinitions = [
	{ featureName: 'Array.prototype.@@iterator', receiverTypes: ['array'] },
	{ featureName: 'DOMTokenList.prototype.@@iterator', receiverTypes: ['dom-token-list'] },
	{ featureName: 'HTMLCollection.prototype.@@iterator', receiverTypes: ['html-collection'] },
	{ featureName: 'NodeList.prototype.@@iterator', receiverTypes: ['node-list'] },
	{ featureName: 'String.prototype.@@iterator', receiverTypes: ['string'] },
	{ featureName: 'TypedArray.prototype.@@iterator', receiverTypes: ['typed-array'] }
];

export const GLOBAL_IDENTIFIER_FEATURE_DEFINITIONS = globalIdentifierDefinitions;
export const EXACT_CHAIN_FEATURE_DEFINITIONS = exactChainDefinitions;
export const INSTANCE_MEMBER_FEATURE_DEFINITIONS = instanceMemberDefinitions;
export const ITERATION_SYNTAX_FEATURE_DEFINITIONS = iterationSyntaxDefinitions;
export const SPECIAL_DETECTABLE_FEATURE_NAMES = new Set(['Error.cause', 'Event.focusin', 'Event.hashchange']);
export const DETECTABLE_FEATURE_NAMES = new Set([
	...globalIdentifierDefinitions.map((definition) => definition.featureName),
	...exactChainDefinitions.map((definition) => definition.featureName),
	...instanceMemberDefinitions.map((definition) => definition.featureName),
	...iterationSyntaxDefinitions.map((definition) => definition.featureName),
	...SPECIAL_DETECTABLE_FEATURE_NAMES
]);

function createGlobalIdentifierDefinitions(runtimePairs) {
	return runtimePairs.map(([runtimeName, featureName]) => ({ runtimeName, featureName }));
}

function createExactChainDefinitions(rootName, propertyMap) {
	return Object.entries(propertyMap).map(([propertyName, featureName]) => ({
		chain: [rootName, propertyName],
		featureName
	}));
}

function createPrototypeChainDefinitions(rootName, propertyMap) {
	return Object.entries(propertyMap).map(([propertyName, featureName]) => ({
		chain: [rootName, 'prototype', propertyName],
		featureName
	}));
}

function createInstanceMemberDefinitions(receiverTypes, propertyMap) {
	return Object.entries(propertyMap).map(([propertyName, featureName]) => ({
		receiverTypes,
		propertyName,
		featureName
	}));
}
