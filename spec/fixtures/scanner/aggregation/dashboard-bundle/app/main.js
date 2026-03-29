export function startDashboard() {
	const controller = new AbortController();

	return Promise.allSettled([
		fetch('/api/cards', {
			signal: controller.signal
		})
	]);
}
