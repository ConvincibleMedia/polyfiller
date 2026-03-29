import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareSemver } from '../support/semver.js';

const DEFAULT_POLYFILL_DIRECTORY = fileURLToPath(new URL('../../polyfills', import.meta.url));

/**
 * Load and normalise the supported versioned polyfill lists from disk.
 * Adding a new version is intentionally simple: drop another `x.y.z.txt` file into `polyfills/`.
 */
export class VersionedPolyfillRegistry {
	/**
	 * @param {object} [options]
	 * @param {string} [options.polyfillDirectory]
	 */
	constructor({ polyfillDirectory = DEFAULT_POLYFILL_DIRECTORY } = {}) {
		this.polyfillDirectory = polyfillDirectory;
		this.versionCache = new Map();
		this.availableVersionsPromise = null;
	}

	/**
	 * Return the sorted list of supported polyfill-library versions.
	 *
	 * @returns {Promise<string[]>}
	 */
	async listVersions() {
		if (!this.availableVersionsPromise) {
			this.availableVersionsPromise = this.#loadAvailableVersions();
		}

		return this.availableVersionsPromise;
	}

	/**
	 * Return the newest supported version discovered on disk.
	 *
	 * @returns {Promise<string>}
	 */
	async getLatestVersion() {
		const versions = await this.listVersions();

		if (versions.length === 0) {
			throw new Error(`No polyfill versions were found in ${this.polyfillDirectory}.`);
		}

		return versions[versions.length - 1];
	}

	/**
	 * Load the available feature names for a specific version.
	 * The returned list is trimmed, de-duplicated, and sorted for deterministic downstream behaviour.
	 *
	 * @param {object} options
	 * @param {string} [options.targetVersion]
	 * @returns {Promise<{ targetVersion: string, availableFeatures: string[] }>}
	 */
	async getVersionData({ targetVersion } = {}) {
		const resolvedVersion = targetVersion ?? await this.getLatestVersion();

		if (!this.versionCache.has(resolvedVersion)) {
			const availableVersions = await this.listVersions();

			if (!availableVersions.includes(resolvedVersion)) {
				throw new Error(`Unsupported polyfill version \"${resolvedVersion}\". Supported versions: ${availableVersions.join(', ')}`);
			}

			const filePath = path.join(this.polyfillDirectory, `${resolvedVersion}.txt`);
			const rawContents = await fs.readFile(filePath, 'utf8');
			const availableFeatures = Array.from(new Set(rawContents
				.split(/\r?\n/u)
				.map((line) => line.trim())
				.filter(Boolean)))
				.sort();

			this.versionCache.set(resolvedVersion, {
				targetVersion: resolvedVersion,
				availableFeatures
			});
		}

		return this.versionCache.get(resolvedVersion);
	}

	async #loadAvailableVersions() {
		const directoryEntries = await fs.readdir(this.polyfillDirectory, { withFileTypes: true });

		return directoryEntries
			.filter((entry) => entry.isFile() && entry.name.endsWith('.txt'))
			.map((entry) => entry.name.replace(/\.txt$/u, ''))
			.sort(compareSemver);
	}
}
