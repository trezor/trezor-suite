import { normalizeJUnitSuiteErrors } from './normalizeJUnitSuiteErrors';
import type { JUnitTestSuite } from './normalizeJUnitSuiteErrors';

describe('normalizeJUnitSuiteErrors', () => {
    it('reports a suite that failed to run as one failure with the full Jest message', () => {
        const fullMessage = 'Worker initialization failed\n    at setup (startup.test.ts:12:3)';
        const identity = { name: 'e2e/startup.test.ts', classname: 'Test suite failed to run' };
        const suite: JUnitTestSuite = {
            $: {
                name: 'e2e/startup.test.ts',
                tests: '0',
                failures: '0',
                errors: '1',
                skipped: '0',
            },
            testcase: [
                { $: identity, error: [fullMessage] },
                { $: identity, failure: ['{"message":"Worker initialization failed"}'] },
            ],
        };

        normalizeJUnitSuiteErrors(suite);

        expect(suite).toEqual({
            $: {
                name: 'e2e/startup.test.ts',
                tests: '1',
                failures: '1',
                errors: '0',
                skipped: '0',
            },
            testcase: [{ $: identity, failure: [fullMessage] }],
        });
    });

    it('leaves suites that ran unchanged, including hook failures', () => {
        const suite: JUnitTestSuite = {
            $: { name: 'e2e/send.test.ts', tests: '2', failures: '1', errors: '0', skipped: '0' },
            testcase: [
                { $: { name: 'passed' } },
                { $: { name: 'failed' }, failure: ['Assertion failed'] },
                {
                    $: {
                        name: "Test execution failure: could be caused by test hooks like 'afterAll'.",
                    },
                    failure: ['{"message":"afterAll failed"}'],
                },
            ],
        };
        const original = JSON.stringify(suite);

        normalizeJUnitSuiteErrors(suite);

        expect(JSON.stringify(suite)).toBe(original);
    });
});
