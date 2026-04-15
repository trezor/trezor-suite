import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

import { error, log, output } from '../logger';
import type { CoverageIndex } from './types';

const COVERAGE_MAP_URL = 'https://dev.suite.sldev.cz/coverage/e2e/index.json';
const DEFAULT_COVERAGE_MAP_FILE = 'coverage-map/index.json';

const downloadCoverageMap = async (localFile: string): Promise<void> => {
    const dir = path.dirname(localFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const fileExists = fs.existsSync(localFile);

    if (fileExists) {
        try {
            const localMd5 = createHash('md5').update(fs.readFileSync(localFile)).digest('hex');
            const head = await fetch(COVERAGE_MAP_URL, { method: 'HEAD' });
            if (head.ok) {
                const remoteEtag = head.headers.get('etag')?.replace(/"/g, '');
                if (localMd5 === remoteEtag) {
                    log('Coverage map is up to date, skipping download.');

                    return;
                }
            } else {
                log(
                    `Coverage map freshness check failed (${head.status}), using existing local file.`,
                );

                return;
            }
        } catch (err) {
            log(
                `Coverage map freshness check failed (${err instanceof Error ? err.message : err}), using existing local file.`,
            );

            return;
        }
    }

    log(`Downloading coverage map from ${COVERAGE_MAP_URL}...`);
    try {
        const response = await fetch(COVERAGE_MAP_URL);
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        const content = await response.text();
        fs.writeFileSync(localFile, content, 'utf8');
        log('Coverage map downloaded successfully.');
    } catch (err) {
        if (fs.existsSync(localFile)) {
            log(
                `Coverage map download failed (${err instanceof Error ? err.message : err}), using existing local file.`,
            );
        } else {
            throw new Error(
                `Failed to download coverage map: ${err instanceof Error ? err.message : err}`,
            );
        }
    }
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
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        log(
            [
                'Usage: yarn workspace @trezor/e2e-utils select-tests [options]',
                '',
                'Given a list of changed source files (one per line on stdin or via --files),',
                'reads the coverage map index and prints the test files that cover any of those files.',
                '',
                'Options:',
                '  --coverage-map <file>    Path to the coverage map index JSON.',
                '                           When omitted, the index is automatically downloaded from S3.',
                '',
                '  --files <file1,file2>    Comma-separated list of changed files instead of reading from stdin.',
                '',
                '  --help, -h               Show this help message and exit.',
                '',
                'Usage (stdin):',
                '  # Committed branch changes only:',
                '  git diff --name-only origin/develop...HEAD | \\',
                '    yarn workspace @trezor/e2e-utils select-tests --coverage-map coverage-map/index.json',
                '',
                '  # Staged changes only:',
                '  git diff --name-only --cached | \\',
                '    yarn workspace @trezor/e2e-utils select-tests --coverage-map coverage-map/index.json',
                '',
                '  # Unstaged changes only:',
                '  git diff --name-only | \\',
                '    yarn workspace @trezor/e2e-utils select-tests --coverage-map coverage-map/index.json',
                '',
                '  # All changes vs origin/develop (committed + staged + unstaged):',
                '  { git diff --name-only --cached origin/develop; git diff --name-only origin/develop; } | sort -u | \\',
                '    yarn workspace @trezor/e2e-utils select-tests --coverage-map coverage-map/index.json',
                '',
                'Usage (explicit files):',
                '  yarn workspace @trezor/e2e-utils select-tests \\',
                '    --coverage-map coverage-map/index.json \\',
                '    --files packages/suite/src/views/dashboard/index.tsx,packages/suite/src/hooks/useDevice.ts',
                '',
                'Output: matched test file paths, one per line.',
            ].join('\n'),
        );

        return;
    }

    let coverageMapFileArg: string | null = null;
    let explicitFiles: string[] = [];

    for (let i = 0; i < args.length; i++) {
        const nextArg = args[i + 1];
        if (args[i] === '--coverage-map' && nextArg) {
            coverageMapFileArg = nextArg;
            i++;
        } else if (args[i] === '--files' && nextArg) {
            explicitFiles = nextArg.split(',').filter(Boolean);
            i++;
        }
    }

    let coverageMapFile: string;

    if (coverageMapFileArg === null) {
        coverageMapFile = DEFAULT_COVERAGE_MAP_FILE;
        await downloadCoverageMap(coverageMapFile);
    } else {
        coverageMapFile = coverageMapFileArg;
    }

    if (!fs.existsSync(coverageMapFile)) {
        error(`Coverage map not found: ${coverageMapFile}`);
        error('Run buildCoverageMap.ts first to generate it.');
        process.exit(1);
    }

    const index: CoverageIndex = JSON.parse(fs.readFileSync(coverageMapFile, 'utf8'));

    const stdinFiles = await readStdin();
    const changedFiles = [...new Set([...stdinFiles, ...explicitFiles])];

    if (changedFiles.length === 0) {
        error('No changed files provided. Pipe git diff output or use --files.');
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
        log(`No tests found covering the ${changedFiles.length} changed file(s).`);
        process.exit(0);
    }

    matchedTestFiles.forEach(f => output(f));
};

main().catch(err => {
    error('[FATAL]', err);
    process.exit(1);
});
