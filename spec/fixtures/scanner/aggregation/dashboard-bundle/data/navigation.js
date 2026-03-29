export function buildNavigationState() {
	const currentUrl = new URL('/app', 'https://example.com');

	window.addEventListener('hashchange', () => {});

	return Object.assign({}, {
		serialisedUrl: currentUrl.toJSON()
	});
}
