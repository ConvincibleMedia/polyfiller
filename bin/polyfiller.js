#!/usr/bin/env node

import { runCli } from '../src/cli/run-cli.js';

runCli().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`${message}\n`);
	process.exitCode = 1;
});
