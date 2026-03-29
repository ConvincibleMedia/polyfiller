import { buildExportRequest } from '../data/export-request.js';
import { mountFilterBar } from '../ui/filter-bar.js';

const reportCards = document.querySelectorAll('.report-card');
reportCards.forEach(() => {});

for (const reportCardNode of reportCards) {
	break;
}

const firstReportCard = document.querySelector('.report-card');
firstReportCard.classList.forEach(() => {});

for (const className of firstReportCard.classList) {
	firstReportCard.classList.replace('is-stale', className);
	break;
}

const dashboardToggleTarget = firstReportCard.closest('.report-grid');
dashboardToggleTarget.toggleAttribute('data-busy', true);

window.addEventListener('hashchange', () => mountFilterBar());

Promise.allSettled([
	buildExportRequest(),
	fetch('/api/report-metadata')
]).finally(() => mountFilterBar());
