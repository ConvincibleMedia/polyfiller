# Polyfiller

Polyfiller scans JavaScript files during a build and emits the Polyfill.io feature names that it can see your code using.

It is version-aware, so the detected output is filtered to the polyfills available in the target polyfill-library release.

It emits a plain array of feature names in either JSON or YAML, which makes it easy to feed into a later step that constructs a Polyfill.io URL.


## What It Does

* Scans JavaScript files with an AST-based analyser rather than regex-only matching.
* Supports versioned polyfill lists from the local `polyfills/*.txt` files.
* Defaults to the latest supported version automatically.
* Writes the detected feature array to stdout when no output file is supplied.
* Writes the same feature array to a file in JSON or YAML when requested.
* Prints a separate `Please check manually` list to stderr for features we intentionally do not auto-detect from JavaScript alone.
* Optionally prints `js file -> polyfills` and `polyfill -> file count` breakdowns to stderr.


## Installation

```bash
npm install --save-dev @convinciblemedia/polyfiller
```

This package is plain ESM JavaScript. There is no transpilation step in the package itself.


## CLI Usage

After installing the package, run the local CLI with:

```bash
npx polyfiller 'dist/**/*.js'
```

Arguments:

* `<glob-pattern>`: The JavaScript files to scan.

Options:

* `--output`, `-o <path>`: Write the detected feature array to a file.
* `--format`, `-f <json|yml|yaml>`: Choose the output format. If omitted, JSON is used unless the output file extension implies YAML.
* `--polyfill-version <version>`: Target a specific polyfill-library version.
* `--polyfill-library-version <version>`: American-English alias for `--polyfill-version`.
* `--report`: Print the per-file and per-feature breakdowns to stderr.
* `--help`, `-h`: Show CLI help.
* `--version`: Print the package version.

Examples:

```bash
npx polyfiller 'dist/**/*.js'
```

```bash
npx polyfiller 'dist/**/*.js' --output build/polyfills.json
```

```bash
npx polyfiller 'dist/**/*.js' --output build/polyfills.yml --format yml
```

```bash
npx polyfiller 'dist/**/*.js' --polyfill-version 3.111.0
```

```bash
npx polyfiller 'dist/**/*.js' --report
```

When no output file is given:

* stdout contains only the machine-readable feature array.
* stderr contains the manual-check list and, if enabled, the human-readable report.

That split is deliberate, so you can pipe stdout into another command without having to strip logs out of it.


## Output

JSON output looks like this:

```json
[
	"Promise",
	"Promise.any",
	"URL",
	"URL.prototype.toJSON"
]
```

YAML output looks like this:

```yaml
- "Promise"
- "Promise.any"
- "URL"
- "URL.prototype.toJSON"
```

The output array contains the direct feature names detected in your JavaScript, using the same names as the relevant version file in `polyfills/`.

Polyfiller does not expand feature dependencies itself in the emitted array. The published `polyfill-library` package carries dependency metadata for each feature, and its bundle-building path resolves those dependencies when constructing polyfill bundles.


## Supported Versions

Supported polyfill-library versions are discovered from the files in `polyfills/`.

Today that means:

* `3.111.0`
* `4.8.0`

If you add another `x.y.z.txt` file later, Polyfiller will automatically treat it as supported and will use the newest version by default.

If a newly added version introduces a feature name that is neither auto-detectable nor explicitly manual-only, Polyfiller throws an error. That is intentional, because it stops silent coverage drift.


## Manual Checks

Some Polyfill.io features are intentionally not auto-detected from JavaScript alone.

These are features that are HTML-driven, CSS-driven, or too broad to detect responsibly from JS scanning without pretending we know more than we do.

When a target version contains any of these, Polyfiller prints them to stderr under `Please check manually`.

Examples include:

* `HTMLPictureElement`
* `HTMLTemplateElement`
* `smoothscroll`
* `UserTiming`
* `WebAnimations`

The exact manual-check list is version-specific.


## Detection Model

Polyfiller groups features by how they need to be detected.

Examples:

* Global identifiers like `Promise`, `URL`, `fetch`, and `AbortController`
* Exact namespace members like `Promise.any`, `Object.assign`, and `Intl.RelativeTimeFormat`
* Prototype members on inferred receiver types like `Array.prototype.includes`, `NodeList.prototype.forEach`, and `URL.prototype.toJSON`
* Iterator-driven syntax such as `for...of`, spread, and array destructuring
* String-literal-driven event features like `Event.hashchange` and `Event.focusin`
* Special constructor option usage such as `Error.cause`

This means the scanner is not just matching text. It parses once, walks the AST, and uses lightweight receiver inference where needed.


## Programmatic Usage

```js
import { analysePolyfills } from '@convinciblemedia/polyfiller';

const result = await analysePolyfills({
	cwd: process.cwd(),
	pattern: 'dist/**/*.js',
	targetVersion: '4.8.0'
});

console.log(result.detectedFeatures);
console.log(result.manualCheckFeatures);
```

The returned object includes:

* `targetVersion`
* `detectedFeatures`
* `manualCheckFeatures`
* `featuresByFilePath`
* `fileCountsByFeature`
* `matchedFileCount`


## Release Workflow

Releases are published locally rather than from GitHub Actions.

1. Update `package.json` to the release version and push the commit.
2. On your local machine, run `npm run release:dry-run`.
3. If the dry run looks right, run `npm run release:publish`.

The local release script requires a clean working tree, checks npm authentication, runs `npm pack --dry-run`, and then publishes the package publicly to npm.


## Repository Notes

* Keep version files in `polyfills/` as simple newline-delimited feature lists.
* If a feature can be detected from JavaScript, add it to the detector catalogue.
* If a feature should not be auto-detected, add it to the manual feature catalogue.
* Avoid introducing regex-only special cases when an AST rule would be clearer and more maintainable.
