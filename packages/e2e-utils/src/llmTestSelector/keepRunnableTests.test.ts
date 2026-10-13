import { keepRunnableTests } from './keepRunnableTests';
import type { SelectionResult, TestRecommendation } from './types';

jest.mock('../logger', () => ({ warn: jest.fn() }));

const ACTIVITY_TEST = 'suite/e2e/tests/activity/activity-page.test.ts';
const DEVICE_TEST = 'suite/e2e/tests/device/device-authenticity.test.ts';
const CONNECT_TEST = 'packages/connect-core/e2e/tests/device/authorizeCoinjoin.test.ts';

const suiteE2ETestFiles = new Set([ACTIVITY_TEST, DEVICE_TEST]);

const recommendation = (test: string): TestRecommendation => ({
    test,
    priority: 'high',
    reasoning: 'The changed file is exercised by this test.',
    related_changes: ['packages/suite/src/views/activity/Activity.tsx'],
});

const llmResult = (tests: string[]): Omit<SelectionResult, 'changed_files'> => ({
    recommendations: tests.map(recommendation),
    summary: 'Activity view changed.',
    uncovered_changes: [],
});

describe('keepRunnableTests', () => {
    it('keeps a recommendation that exists under suite/e2e/tests/ and leaves the summary alone', () => {
        const result = keepRunnableTests({
            llmResult: llmResult([ACTIVITY_TEST]),
            suiteE2ETestFiles,
        });

        expect(result.recommendations.map(({ test }) => test)).toEqual([ACTIVITY_TEST]);
        expect(result.summary).toBe('Activity view changed.');
    });

    it('keeps a test the job resolves from a path relative to suite/e2e/ and emits it root-relative', () => {
        const result = keepRunnableTests({
            llmResult: llmResult(['tests/activity/activity-page.test.ts']),
            suiteE2ETestFiles,
        });

        expect(result.recommendations.map(({ test }) => test)).toEqual([ACTIVITY_TEST]);
        expect(result.summary).toBe('Activity view changed.');
    });

    it('drops a test outside suite/e2e/tests/ and reports it as the model wrote it', () => {
        const result = keepRunnableTests({
            llmResult: llmResult([CONNECT_TEST, DEVICE_TEST]),
            suiteE2ETestFiles,
        });

        expect(result.recommendations.map(({ test }) => test)).toEqual([DEVICE_TEST]);
        expect(result.summary).toBe(
            `Activity view changed. Dropped recommended tests that don't exist under suite/e2e/tests/: ${CONNECT_TEST}.`,
        );
    });

    it('drops a Suite test whose file is gone since the analysis was built', () => {
        const deletedTest = 'suite/e2e/tests/activity/deleted.test.ts';
        const result = keepRunnableTests({
            llmResult: llmResult([ACTIVITY_TEST, deletedTest]),
            suiteE2ETestFiles,
        });

        expect(result.recommendations.map(({ test }) => test)).toEqual([ACTIVITY_TEST]);
        expect(result.summary).toBe(
            `Activity view changed. Dropped recommended tests that don't exist under suite/e2e/tests/: ${deletedTest}.`,
        );
    });

    it('announces the full-suite fallback when nothing runnable is left', () => {
        const result = keepRunnableTests({
            llmResult: llmResult([CONNECT_TEST]),
            suiteE2ETestFiles,
        });

        expect(result.recommendations).toEqual([]);
        expect(result.summary).toBe(
            `Activity view changed. Dropped recommended tests that don't exist under suite/e2e/tests/: ${CONNECT_TEST}. Falling back to the full e2e suite.`,
        );
    });
});
