import { normalizeJUnitSuiteErrors } from './normalizeJUnitSuiteErrors';
import type { JUnitTestSuite } from './normalizeJUnitSuiteErrors';

const stack = 'Worker initialization failed\n    at setup (startup.test.ts:12:3)';
const suiteErrorIdentity = { name: 'e2e/startup.test.ts', classname: 'Test suite failed to run' };

describe('normalizeJUnitSuiteErrors', () => {
    it('keeps one failed testcase with the full stack for a suite that failed to load', () => {
        const suite: JUnitTestSuite = {
            $: { name: 'e2e/startup.test.ts', tests: '0', failures: '0', errors: '1' },
            testcase: [
                { $: suiteErrorIdentity, error: [stack] },
                { $: suiteErrorIdentity, failure: ['{"message":"Worker initialization failed"}'] },
            ],
        };

        normalizeJUnitSuiteErrors(suite);

        expect(suite.testcase).toEqual([{ $: suiteErrorIdentity, failure: [stack] }]);
        expect(suite.$).toEqual({
            name: 'e2e/startup.test.ts',
            tests: '1',
            failures: '1',
            errors: '0',
            skipped: '0',
        });
    });

    it('removes the synthetic duplicate regardless of its position', () => {
        const suite: JUnitTestSuite = {
            testcase: [
                { $: suiteErrorIdentity, failure: ['Short error'] },
                { $: suiteErrorIdentity, error: [stack] },
            ],
        };

        normalizeJUnitSuiteErrors(suite);

        expect(suite.testcase).toEqual([{ $: suiteErrorIdentity, failure: [stack] }]);
    });

    it('preserves genuine tests with identical names', () => {
        const identity = { name: 'same test title', classname: 'parameterized test' };
        const suite: JUnitTestSuite = {
            $: { tests: '4', failures: '1', errors: '1', skipped: '1' },
            testcase: [
                { $: identity, error: [stack] },
                { $: identity, failure: ['Assertion failed'] },
                { $: identity },
                { $: identity, skipped: [{}] },
            ],
        };

        normalizeJUnitSuiteErrors(suite);

        expect(suite.testcase).toEqual([
            { $: identity, failure: [stack] },
            { $: identity, failure: ['Assertion failed'] },
            { $: identity },
            { $: identity, skipped: [{}] },
        ]);
        expect(suite.$).toEqual({ tests: '4', failures: '2', errors: '0', skipped: '1' });
    });

    it('preserves failure details and testcase metadata when converting an error', () => {
        const suite: JUnitTestSuite = {
            testcase: [
                {
                    $: suiteErrorIdentity,
                    error: [stack],
                    failure: ['Additional failure'],
                    properties: [{ property: [{ $: { name: 'artifact', value: 'path' } }] }],
                },
            ],
        };

        normalizeJUnitSuiteErrors(suite);

        expect(suite.testcase?.[0]).toEqual({
            $: suiteErrorIdentity,
            failure: [stack, 'Additional failure'],
            properties: [{ property: [{ $: { name: 'artifact', value: 'path' } }] }],
        });
    });

    it('leaves suites without error testcases unchanged', () => {
        const suite: JUnitTestSuite = {
            $: { tests: '2', failures: '1', errors: '0' },
            testcase: [
                { $: { name: 'passed' } },
                { $: { name: 'failed' }, failure: ['Assertion failed'] },
            ],
        };
        const original = JSON.stringify(suite);

        normalizeJUnitSuiteErrors(suite);

        expect(JSON.stringify(suite)).toBe(original);
    });

    it('accepts an empty suite', () => {
        const suite: JUnitTestSuite = {};

        normalizeJUnitSuiteErrors(suite);

        expect(suite).toEqual({});
    });
});
