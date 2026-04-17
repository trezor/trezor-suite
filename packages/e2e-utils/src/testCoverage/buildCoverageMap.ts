/* eslint-disable no-console */
/**
 * Merges per-test coverage JSON files into a reverse index:
 *   { sourceFile: testFile[] }
 *
 * Usage:
 *   ts-node packages/e2e-utils/src/testCoverage/buildCoverageMap.ts \
 *     --input coverage-map \
 *     --output coverage-map/index.json
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type { CoverageIndex, PerTestCoverage } from './types';

const parseArgs = () => {
    const args = process.argv.slice(2);
    let inputDir = 'coverage-map';
    let outputFile = 'coverage-map/index.json';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--input' && args[i + 1]) {
            inputDir = args[++i];
        } else if (args[i] === '--output' && args[i + 1]) {
            outputFile = args[++i];
        }
    }

    return { inputDir, outputFile };
};

const main = async () => {
    const { inputDir, outputFile } = parseArgs();

    let entries: string[];
    try {
        entries = await fs.readdir(inputDir);
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            console.error(`Input directory does not exist: ${inputDir}`);
            process.exit(1);
        }
        throw err;
    }
    const jsonFiles = entries.filter(f => f.endsWith('.json') && f !== 'index.json').sort();

    if (jsonFiles.length === 0) {
        console.error(`No per-test JSON files found in ${inputDir}`);
        process.exit(1);
    }

    const index: CoverageIndex = {};

    for (const file of jsonFiles) {
        const raw = await fs.readFile(path.join(inputDir, file), 'utf8');
        const data: PerTestCoverage = JSON.parse(raw);

        for (const sourceFile of data.coveredFiles) {
            if (!index[sourceFile]) {
                index[sourceFile] = [];
            }
            if (!index[sourceFile].includes(data.file)) {
                index[sourceFile].push(data.file);
            }
        }
    }

    const sourceFileCount = Object.keys(index).length;
    const testFileCount = new Set(Object.values(index).flat()).size;

    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    const sortedIndex = Object.fromEntries(
        Object.entries(index)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => [k, [...v].sort()]),
    );
    await fs.writeFile(outputFile, JSON.stringify(sortedIndex, null, 2));

    console.log(
        `Coverage map built: ${sourceFileCount} source files mapped to ${testFileCount} test files`,
    );
    console.log(`Output: ${outputFile}`);
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
