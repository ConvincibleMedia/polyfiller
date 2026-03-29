/**
 * Parse a simple semver string into numeric parts.
 * Use this for ordering supported polyfill-library versions discovered on disk.
 *
 * @param {string} version
 * @returns {number[]}
 */
export function parseSemver(version) {
	return version.split('.').map((part) => Number.parseInt(part, 10));
}

/**
 * Compare two simple semver strings.
 * A positive value means `left` is newer, a negative value means `right` is newer.
 *
 * @param {string} left
 * @param {string} right
 * @returns {number}
 */
export function compareSemver(left, right) {
	const leftParts = parseSemver(left);
	const rightParts = parseSemver(right);
	const partCount = Math.max(leftParts.length, rightParts.length);

	for (let index = 0; index < partCount; index += 1) {
		const leftPart = leftParts[index] ?? 0;
		const rightPart = rightParts[index] ?? 0;

		if (leftPart !== rightPart) {
			return leftPart - rightPart;
		}
	}

	return 0;
}
