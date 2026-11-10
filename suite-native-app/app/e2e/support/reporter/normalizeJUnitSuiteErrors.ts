type JUnitTestCase = {
    $: { name: string; classname?: string };
    error?: string[];
    failure?: string[];
};

export type JUnitTestSuite = {
    $?: { name?: string; tests?: string; failures?: string; errors?: string; skipped?: string };
    testcase?: JUnitTestCase[];
};

/**
 * jest-junit writes <error> only for a suite that failed to run: a testcase with the full Jest
 * message followed by a duplicate <failure> with just the error. Currents treats <error> as
 * passed, so the suite is reduced to a single <failure> with the full message.
 */
export const normalizeJUnitSuiteErrors = (suite: JUnitTestSuite): void => {
    const errorTestCase = suite.testcase?.find(testCase => testCase.error !== undefined);
    if (errorTestCase?.error === undefined) return;

    suite.testcase = [{ $: errorTestCase.$, failure: errorTestCase.error }];
    suite.$ = { ...suite.$, tests: '1', failures: '1', errors: '0' };
};
