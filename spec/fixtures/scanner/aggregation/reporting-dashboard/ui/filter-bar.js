export function mountFilterBar() {
	const filterForm = document.createElement('form');
	filterForm.requestSubmit();

	const startDateInput = document.createElement('input');
	startDateInput.valueAsDate = new Date('2026-03-29T00:00:00.000Z');

	const teamSelect = document.createElement('select');
	teamSelect.selectedOptions;

	const filterPanel = document.createElement('section');
	const filterRows = filterPanel.children;
	for (const filterRow of filterRows) {
		break;
	}

	const routeLabel = document.querySelector('.report-card');
	routeLabel.dataset.route = String(routeLabel.dataset.route).replaceAll('-', '/');

	Array.from(document.querySelectorAll('.report-card')).flatMap(() => ['daily/report']);
	Object.fromEntries([['hasDailyReport', Array.from(document.querySelectorAll('.report-card')).includes(routeLabel)]]);

	window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {});
}
