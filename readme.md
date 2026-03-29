# Polyfiller

![Alpha](https://img.shields.io/badge/status-alpha-red)

Scans JavaScript files and emits list of used features that Polyfill.io can polyfill.

* Defaults to Polyfill.io library version 4.8.0, but can also work with 3.111.0.
* Emits array of feature names to `stdout` or to JSON or YAML.

Use the detected feature list to create a Polyfill.io URL requesting polyfills for just those features.

Features are detected by parsing JavaScript files into an AST, not with brittle regexes.


## Quickstart

```bash
npm install --save-dev @convinciblemedia/polyfiller
npx polyfiller 'dist/**/*.js'
```

Arguments:

* `<glob-pattern>`: The JavaScript files to scan.

Options:

* `--output`, `-o <path>`: Write the detected feature array to a file.
* `--format`, `-f <json|yml|yaml>`: Choose the output format. If omitted, Polyfiller infers it from the output path extension, then falls back to JSON.
* `--library-version <version>`: Target a specific polyfill-library version.
* `--report`: Print the per-file and per-feature breakdowns to stderr.
* `--help`, `-h`: Show CLI help.
* `--version`: Print the CLI package version.

When no output file is given:

* `stdout` contains only the machine-readable feature array.
* `stderr` contains warnings for skipped files and the human-readable report if enabled.

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

The output array contains the direct feature names detected in your JavaScript, using the same names as Polyfill.io.


## Supported Versions

The published package ships with built-in support for these Polyfill.io library versions:

* `3.111.0`
* `4.8.0`

CLI consumers cannot point Polyfiller at arbitrary custom feature lists. Support only expands when the library itself ships another bundled `x.y.z.txt` file in a later release.

If a bundled version contains features that Polyfiller does not currently know how to detect from JavaScript, those features are simply never emitted.


## Programmatic Usage

```js
import { analysePolyfills } from '@convinciblemedia/polyfiller';

const result = await analysePolyfills({
	cwd: process.cwd(),
	pattern: 'dist/**/*.js',
	targetVersion: '4.8.0'
});

console.log(result.detectedFeatures);
console.log(result.warnings);
```

The returned object includes:

* `targetVersion`
* `detectedFeatures`
* `warnings`
* `featuresByFilePath`
* `fileCountsByFeature`
* `matchedFileCount`
