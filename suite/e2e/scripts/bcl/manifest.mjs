#!/usr/bin/env node
/**
 * [throwaway: blockchain-link request baseline]
 * Rebuild runs.json (the viewer's history manifest) from a directory of summary-*.json files
 * synced down from S3. Pure function of the directory — concurrency-safe, no in-place mutation.
 *
 * Usage:  node suite/e2e/scripts/bcl/manifest.mjs <runsDir> <out runs.json>
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const [runsDir, outFile] = process.argv.slice(2);
if (!runsDir || !outFile) {
    console.error('usage: manifest.mjs <runsDir> <runs.json>');
    process.exit(1);
}

const CAP = 200; // bound viewer load; older run files are kept for archival

let files = [];
try {
    files = readdirSync(runsDir).filter(f => f.startsWith('summary-') && f.endsWith('.json'));
} catch {
    files = [];
}

const runs = [];
for (const f of files) {
    try {
        const s = JSON.parse(readFileSync(join(runsDir, f), 'utf8'));
        const r = s.run || {};
        runs.push({
            sha: r.sha || '',
            shaShort: r.shaShort || '',
            branch: r.branch || '',
            ts: r.ts || '',
            runId: r.runId || '',
            file: `runs/${f}`,
            coins: r.coins || Object.keys(s.coins || {}),
        });
    } catch {
        // skip unreadable
    }
}

runs.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));

const manifest = {
    schema: 1,
    generated: process.env.RUN_TS || '',
    runs: runs.slice(0, CAP),
};

writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`wrote ${outFile}: ${manifest.runs.length} runs (of ${runs.length})`);
