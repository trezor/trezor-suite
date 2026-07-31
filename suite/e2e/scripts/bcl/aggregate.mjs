#!/usr/bin/env node
/**
 * [throwaway: blockchain-link request baseline]
 * Aggregate one CI run's bcl.jsonl into a machine-readable summary.json.
 *
 * Usage:  node suite/e2e/scripts/bcl/aggregate.mjs <in.jsonl> <out.json>
 * Run metadata is read from env: SHA, SHA_SHORT, BRANCH, RUN_TS, RUN_ID, BCL_IDLE_MS, BCL_COINS.
 *
 * Mirrors the per-coin marker windowing + NON_BACKEND host filter of .context/bcl-analyze.mjs.
 * Assumes serial execution (workers:1) so per-coin marker windows never overlap.
 */
import { readFileSync, writeFileSync } from 'fs';

const [inFile, outFile] = process.argv.slice(2);
if (!inFile || !outFile) {
    console.error('usage: aggregate.mjs <in.jsonl> <out.json>');
    process.exit(1);
}

const entries = readFileSync(inFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(l => {
        try {
            return JSON.parse(l);
        } catch {
            return null;
        }
    })
    .filter(Boolean)
    .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));

// non-backend hosts the global fetch patch also catches (device bridge, firmware/config CDN)
const NON_BACKEND = /(^127\.0\.0\.1|^localhost|(^|\.)data\.trezor\.io$)/;
const host = url => {
    try {
        return new URL(String(url).replace(/^ws/, 'http')).host;
    } catch {
        return String(url);
    }
};
const isBackendWire = e => e.lvl === 'wire' && !NON_BACKEND.test(host(e.url));
const methodOf = e => (Array.isArray(e.method) ? '[batch]' : (e.method ?? '?'));
const round2 = n => Math.round(n * 100) / 100;

const byMethod = arr => {
    const m = {};
    for (const e of arr) {
        const k = methodOf(e);
        m[k] = (m[k] || 0) + 1;
    }
    return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]));
};

const markers = entries.filter(e => e.lvl === 'marker');
const byCoin = {};
for (const mk of markers) (byCoin[mk.coin] ??= []).push(mk);

const coins = {};
for (const [coin, ms] of Object.entries(byCoin)) {
    const start = ms.find(m => m.phase === 'discovery-start')?.ts;
    const done = ms.find(m => m.phase === 'discovery-done')?.ts;
    const idleEnd = ms.find(m => m.phase === 'idle-done')?.ts;
    if (start == null || done == null) continue;

    const inWindow = (a, b) => entries.filter(e => e.ts >= a && e.ts < b);
    const disc = inWindow(start, done);
    const idle = idleEnd != null ? inWindow(done, idleEnd) : [];
    const idleMin = idleEnd != null ? (idleEnd - done) / 60000 : 0;

    const discLogical = disc.filter(e => e.lvl === 'logical');
    const discWire = disc.filter(isBackendWire);
    const idleWire = idle.filter(isBackendWire);

    coins[coin] = {
        discovery: {
            logical: discLogical.length,
            wire: discWire.length,
            amp: discLogical.length ? round2(discWire.length / discLogical.length) : null,
            byMethod: byMethod(discWire),
        },
        idle: {
            wire: idleWire.length,
            ratePerMin: idleMin > 0 ? round2(idleWire.length / idleMin) : null,
            byMethod: byMethod(idleWire),
        },
    };
}

const summary = {
    schema: 1,
    run: {
        sha: process.env.SHA || '',
        shaShort: process.env.SHA_SHORT || (process.env.SHA || '').slice(0, 7),
        branch: process.env.BRANCH || '',
        ts: process.env.RUN_TS || '',
        runId: process.env.RUN_ID || '',
        idleMs: Number(process.env.BCL_IDLE_MS || 0),
        coins: (process.env.BCL_COINS || Object.keys(coins).join(','))
            .split(',')
            .map(c => c.trim())
            .filter(Boolean),
    },
    coins,
};

writeFileSync(outFile, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`wrote ${outFile}: ${Object.keys(coins).length} coins, ${entries.length} entries`);
