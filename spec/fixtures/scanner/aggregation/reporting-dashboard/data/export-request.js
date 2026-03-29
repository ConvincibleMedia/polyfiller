export function buildExportRequest() {
	const liveRegionText = document.createTextNode('Preparing export');
	liveRegionText.replaceWith('Export ready');

	const liveRegion = document.createDocumentFragment();
	liveRegion.replaceChildren(liveRegionText);

	const chartCanvas = document.createElement('canvas');
	chartCanvas.toBlob(() => {});

	const exportUrl = new URL('/api/reports/export', 'https://example.com');
	const exportHeaders = new Uint8Array([0x50, 0x4b]);
	const headerIterator = exportHeaders[Symbol.iterator]();
	headerIterator.next();

	return fetch(exportUrl.toJSON(), {
		method: 'POST',
		body: exportHeaders
	});
}

new Error('Could not queue the export', { cause: new Uint8Array([0x45]) });

/*
Promise.any([fetch('/should-not-detect')]);
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {});
*/
