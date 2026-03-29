const embeddedExample = `
Promise.any([fetch('/api/export')]);
new URL('/api/export', 'https://example.com').toJSON();
`;

const previewPanel = <aside>{/* Promise.allSettled([fetch('/api/comments')]); */}</aside>;

/*
window.addEventListener('hashchange', () => {});
for (const reportCard of document.querySelectorAll('.report-card')) {
	reportCard.classList.replace('is-stale', 'is-ready');
}
new Error('Could not save report', { cause: previousError });
*/

const runtimeStub = {
	request: { whenReady() {} },
	reportCard: { classList: { replace() {} }, dataset: {} }
};

const getDynamicPropertyName = () => 'whenReady';
runtimeStub.request[getDynamicPropertyName()]?.();
runtimeStub.reportCard[getDynamicPropertyName()];
