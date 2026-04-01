/* eslint-disable no-console */
/**
 * Given a list of changed source files (one per line on stdin or via --files),
 * reads the coverage map index and prints the test files that cover any of those files.
 *
 * Usage (stdin):
 *   git diff --name-only origin/develop...HEAD | \
 *     ts-node packages/e2e-utils/src/testCoverage/selectTestsByChangedFiles.ts \
 *     --coverage-map coverage-map/index.json
 *
 * Usage (explicit files):
 *   ts-node packages/e2e-utils/src/testCoverage/selectTestsByChangedFiles.ts \
 *     --coverage-map coverage-map/index.json \
 *     --files packages/suite/src/views/dashboard/index.tsx,packages/suite/src/hooks/useDevice.ts
 *
 * Output: matched test file paths, one per line.
 */

import * as fs from 'node:fs';
import * as readline from 'node:readline';

import type { CoverageIndex } from './types';

const parseArgs = () => {
    const args = process.argv.slice(2);
    let coverageMapFile = 'coverage-map/index.json';
    let explicitFiles: string[] = [];

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--coverage-map' && args[i + 1]) {
            coverageMapFile = args[++i];
        } else if (args[i] === '--files' && args[i + 1]) {
            explicitFiles = args[++i].split(',').filter(Boolean);
        }
    }

    return { coverageMapFile, explicitFiles };
};

const readStdin = (): Promise<string[]> =>
    new Promise(resolve => {
        if (process.stdin.isTTY) {
            resolve([]);

            return;
        }
        const lines: string[] = [];
        const rl = readline.createInterface({ input: process.stdin });
        rl.on('line', line => {
            const trimmed = line.trim();
            if (trimmed) lines.push(trimmed);
        });
        rl.on('close', () => resolve(lines));
    });

const main = async () => {
    const { coverageMapFile, explicitFiles } = parseArgs();

    if (!fs.existsSync(coverageMapFile)) {
        console.error(`Coverage map not found: ${coverageMapFile}`);
        console.error('Run buildCoverageMap.ts first to generate it.');
        process.exit(1);
    }

    const index: CoverageIndex = JSON.parse(fs.readFileSync(coverageMapFile, 'utf8'));

    const stdinFiles = await readStdin();
    const changedFiles = [...new Set([...stdinFiles, ...explicitFiles])];

    if (changedFiles.length === 0) {
        console.error('No changed files provided. Pipe git diff output or use --files.');
        process.exit(1);
    }

    const matchedTestFiles = new Set<string>();

    for (const changedFile of changedFiles) {
        const testFiles = index[changedFile];
        if (testFiles) {
            testFiles.forEach(f => matchedTestFiles.add(f));
        }
    }

    if (matchedTestFiles.size === 0) {
        console.error(`No tests found covering the ${changedFiles.length} changed file(s).`);
        process.exit(0);
    }

    matchedTestFiles.forEach(f => console.log(f));
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
