import fs from 'node:fs/promises';
import path from 'node:path';

const SPEC_WORKSPACE_DIRECTORY = path.resolve(process.cwd(), '.spec-workspace');

/**
 * Create an isolated on-disk workspace for a test case and remove it afterwards.
 * The scanner works on real files, so these helpers let the suite exercise the same filesystem paths as production usage.
 */
export async function withWorkspace({ workspaceName, filesByRelativePath }, callback) {
	const workspacePath = path.join(SPEC_WORKSPACE_DIRECTORY, sanitiseWorkspaceName(workspaceName));
	await fs.rm(workspacePath, { force: true, recursive: true });
	await fs.mkdir(workspacePath, { recursive: true });

	try {
		for (const [relativePath, contents] of Object.entries(filesByRelativePath)) {
			const filePath = path.join(workspacePath, relativePath);
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, contents, 'utf8');
		}

		return await callback(workspacePath);
	} finally {
		await fs.rm(workspacePath, { force: true, recursive: true });
	}
}

function sanitiseWorkspaceName(workspaceName) {
	return workspaceName.toLowerCase().replace(/[^a-z0-9-]+/gu, '-');
}
