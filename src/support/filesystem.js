import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Ensure that a file's parent directory exists before writing it.
 *
 * @param {string} filePath
 * @returns {Promise<void>}
 */
export async function ensureParentDirectory(filePath) {
	const directoryPath = path.dirname(filePath);
	await fs.mkdir(directoryPath, { recursive: true });
}

/**
 * Read a UTF-8 text file from disk.
 *
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function readTextFile(filePath) {
	return fs.readFile(filePath, 'utf8');
}

/**
 * Write a UTF-8 text file, creating parent directories as needed.
 *
 * @param {object} options
 * @param {string} options.filePath
 * @param {string} options.contents
 * @returns {Promise<void>}
 */
export async function writeTextFile({ filePath, contents }) {
	await ensureParentDirectory(filePath);
	await fs.writeFile(filePath, contents, 'utf8');
}
