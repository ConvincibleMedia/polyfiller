structuredClone({
	ok: true
});

new Error('broken', {
	cause: new Error('root cause')
});

for (const panel of document.getElementsByClassName('panel')) {
	panel;
}
