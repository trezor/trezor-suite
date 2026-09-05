import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
    createTypeScriptPerformanceReport,
    parseTypeScriptExtendedDiagnostics,
} from '../typescriptPerformanceSentinel.js';

const createSnapshot = ({ sourceSha, projects }) => ({
    schemaVersion: 1,
    sourceSha,
    generatedAt: '2026-07-19T12:00:00.000Z',
    projects,
});

test('parses deterministic metrics from Nx-prefixed extended diagnostics', () => {
    const diagnostics = [
        '\u001b[32m@trezor/alpha: Types: 1,200\u001b[0m',
        '@trezor/alpha: Instantiations: 340',
        '@trezor/alpha: Assignability cache size: 90',
        '@trezor/alpha: Identity cache size: 4',
        '@trezor/alpha: Subtype cache size: 3',
        '@trezor/alpha: Strict subtype cache size: 2',
        '@trezor/alpha: Aggregate Types: 1,200',
        '@trezor/alpha: Types: 10',
        'invalid | project: Types: 999',
    ].join('\n');

    assert.deepEqual(parseTypeScriptExtendedDiagnostics(diagnostics), {
        '@trezor/alpha': {
            types: 1210,
            instantiations: 340,
            assignabilityCacheSize: 90,
            identityCacheSize: 4,
            subtypeCacheSize: 3,
            strictSubtypeCacheSize: 2,
        },
    });
});

test('renders a comparison for projects present in both snapshots', () => {
    const baseline = createSnapshot({
        sourceSha: '1111111111111111111111111111111111111111',
        projects: {
            '@trezor/alpha': {
                types: 1000,
                instantiations: 500,
                assignabilityCacheSize: 100,
                identityCacheSize: 10,
                subtypeCacheSize: 5,
                strictSubtypeCacheSize: 2,
            },
        },
    });
    const current = createSnapshot({
        sourceSha: '2222222222222222222222222222222222222222',
        projects: {
            '@trezor/alpha': {
                types: 900,
                instantiations: 550,
                assignabilityCacheSize: 80,
                identityCacheSize: 10,
                subtypeCacheSize: 4,
                strictSubtypeCacheSize: 2,
            },
            '@trezor/new-project': {
                types: 25,
                instantiations: 5,
                assignabilityCacheSize: 3,
                identityCacheSize: 0,
                subtypeCacheSize: 0,
                strictSubtypeCacheSize: 0,
            },
        },
    });

    const report = createTypeScriptPerformanceReport({
        baseline,
        current,
        typeCheckOutcome: 'success',
        workflowRunUrl: 'https://github.com/trezor/trezor-suite/actions/runs/123',
    });

    assert.match(report, /<!-- typescript-performance-sentinel:v1 -->/);
    assert.match(report, /Compared `2222222` with `develop@1111111`/);
    assert.match(report, /\| Types \| 1,000 \| 900 \| −100 \(−10\.0%\) \|/);
    assert.match(report, /\| Instantiations \| 500 \| 550 \| \+50 \(\+10\.0%\) \|/);
    assert.match(report, /@trezor\/new-project.*No baseline/);
    assert.match(report, /https:\/\/github\.com\/trezor\/trezor-suite\/actions\/runs\/123/);
});

test('reports unavailable comparison data without presenting stale results', () => {
    const current = createSnapshot({
        sourceSha: '2222222222222222222222222222222222222222',
        projects: {
            '@trezor/alpha': {
                types: 100,
                instantiations: 50,
                assignabilityCacheSize: 10,
                identityCacheSize: 1,
                subtypeCacheSize: 0,
                strictSubtypeCacheSize: 0,
            },
        },
    });

    const missingBaselineReport = createTypeScriptPerformanceReport({
        current,
        typeCheckOutcome: 'success',
        workflowRunUrl: 'https://github.com/trezor/trezor-suite/actions/runs/123',
    });
    const failedTypeCheckReport = createTypeScriptPerformanceReport({
        current,
        typeCheckOutcome: 'failure',
        workflowRunUrl: 'https://github.com/trezor/trezor-suite/actions/runs/123',
    });

    assert.match(missingBaselineReport, /develop baseline is not available/i);
    assert.match(failedTypeCheckReport, /type-check did not complete successfully/i);
});
