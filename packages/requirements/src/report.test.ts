import { stripVTControlCharacters } from 'node:util';

import { type ReportDeps, createReport } from './report';
import type { RequirementResult } from './runRequirements';

const createConsoleMock = (journal: string[]): ReportDeps['console'] => ({
    log: (message: string) => {
        journal.push(message);
    },
});

describe('report', () => {
    it('returns 0 when all requirements pass', () => {
        const data: string[] = [];
        const report = createReport({ console: createConsoleMock(data) });

        const results: RequirementResult[] = [
            { requirement: 'check-a', target: 'repo', errors: [], durationMs: 10 },
            { requirement: 'check-b', target: 'repo', errors: [], durationMs: 20 },
        ];

        const exitCode = report(results);
        const normalizedData = data.map(stripVTControlCharacters);

        expect(exitCode).toBe(0);
        expect(normalizedData).toEqual([
            '  ✓ check-a [repo]',
            '  ✓ check-b [repo]',
            '',
            'Requirement timings:',
            '  Requirement | Runs | Duration',
            '  ------------+------+---------',
            '  check-b     |    1 |    20 ms',
            '  check-a     |    1 |    10 ms',
            '  Total       |    2 |    30 ms',
            '',
            'All 2 requirement(s) passed.',
        ]);
    });

    it('returns 1 when any requirement fails', () => {
        const data: string[] = [];
        const report = createReport({ console: createConsoleMock(data) });

        const results: RequirementResult[] = [
            { requirement: 'check-a', target: 'repo', errors: ['broken'], durationMs: 1_250 },
        ];

        const exitCode = report(results);
        const normalizedData = data.map(stripVTControlCharacters);

        expect(exitCode).toBe(1);
        expect(normalizedData).toEqual([
            '  ✗ check-a [repo]',
            '      broken',
            '',
            'Requirement timings:',
            '  Requirement | Runs | Duration',
            '  ------------+------+---------',
            '  check-a     |    1 |   1.25 s',
            '  Total       |    1 |   1.25 s',
            '',
            '1 error(s) in 1 requirement(s) failed.',
        ]);
    });

    it('reports both passing and failing requirements', () => {
        const data: string[] = [];
        const report = createReport({ console: createConsoleMock(data) });

        const results: RequirementResult[] = [
            { requirement: 'good', target: 'repo', errors: [], durationMs: 5 },
            {
                requirement: 'bad',
                target: 'alpha',
                errors: ['error-1', 'error-2'],
                durationMs: 15,
            },
        ];

        const exitCode = report(results);
        const normalizedData = data.map(stripVTControlCharacters);

        expect(exitCode).toBe(1);
        expect(normalizedData).toEqual([
            '  ✓ good [repo]',
            '  ✗ bad [alpha]',
            '      error-1',
            '      error-2',
            '',
            'Requirement timings:',
            '  Requirement | Runs | Duration',
            '  ------------+------+---------',
            '  bad         |    1 |    15 ms',
            '  good        |    1 |     5 ms',
            '  Total       |    2 |    20 ms',
            '',
            '2 error(s) in 1 requirement(s) failed.',
        ]);
    });

    it('groups workspace timings by requirement', () => {
        const data: string[] = [];
        const report = createReport({ console: createConsoleMock(data) });

        const results: RequirementResult[] = [
            { requirement: 'workspace-check', target: 'alpha', errors: [], durationMs: 4 },
            { requirement: 'workspace-check', target: 'beta', errors: [], durationMs: 6 },
        ];

        report(results);
        const normalizedData = data.map(stripVTControlCharacters);

        expect(normalizedData).toContain('  workspace-check |    2 |    10 ms');
        expect(normalizedData).toContain('  Total           |    2 |    10 ms');
    });

    it('returns 0 for empty results', () => {
        const data: string[] = [];
        const report = createReport({ console: createConsoleMock(data) });
        const exitCode = report([]);
        const normalizedData = data.map(stripVTControlCharacters);

        expect(exitCode).toBe(0);
        expect(normalizedData).toEqual(['', 'All 0 requirement(s) passed.']);
    });
});
