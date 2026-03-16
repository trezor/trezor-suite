import { stripVTControlCharacters } from 'node:util';

import { type ReportDeps, createReport } from '../report';
import type { RequirementResult } from '../runRequirements';

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
            { requirement: 'check-a', target: 'repo', errors: [] },
            { requirement: 'check-b', target: 'repo', errors: [] },
        ];

        const exitCode = report(results);
        const normalizedData = data.map(stripVTControlCharacters);

        expect(exitCode).toBe(0);
        expect(normalizedData).toEqual([
            '  ✓ check-a [repo]',
            '  ✓ check-b [repo]',
            '',
            'All 2 requirement(s) passed.',
        ]);
    });

    it('returns 1 when any requirement fails', () => {
        const data: string[] = [];
        const report = createReport({ console: createConsoleMock(data) });

        const results: RequirementResult[] = [
            { requirement: 'check-a', target: 'repo', errors: ['broken'] },
        ];

        const exitCode = report(results);
        const normalizedData = data.map(stripVTControlCharacters);

        expect(exitCode).toBe(1);
        expect(normalizedData).toEqual([
            '  ✗ check-a [repo]',
            '      broken',
            '',
            '1 error(s) in 1 requirement(s) failed.',
        ]);
    });

    it('reports both passing and failing requirements', () => {
        const data: string[] = [];
        const report = createReport({ console: createConsoleMock(data) });

        const results: RequirementResult[] = [
            { requirement: 'good', target: 'repo', errors: [] },
            { requirement: 'bad', target: 'alpha', errors: ['error-1', 'error-2'] },
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
            '2 error(s) in 1 requirement(s) failed.',
        ]);
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
