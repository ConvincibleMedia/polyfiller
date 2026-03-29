const controller = new AbortController();

Promise.any([
	controller,
	fetch('/api/status')
]);

const requestUrl = new URL('/api/status', 'https://example.com');
requestUrl.toJSON();

Object.assign({}, {
	controller,
	requestUrl
});

new Intl.RelativeTimeFormat('en-GB');
