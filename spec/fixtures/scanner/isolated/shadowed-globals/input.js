export function buildLocalRuntime({ Promise, document, Intl }) {
	const Object = {
		assign() {}
	};
	const URL = class UrlMock {
		toJSON() {
			return 'mock';
		}
	};

	Promise.any([]);
	document.querySelector('.card');
	Object.assign({}, {});
	new URL('/local', 'https://example.com').toJSON();
	new Intl.RelativeTimeFormat('en-GB');
}
