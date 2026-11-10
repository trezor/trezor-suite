export type JUnitProperty = { $: { name: string; value: string } };
export type JUnitProperties = { property?: JUnitProperty[] };

type JUnitTestCase = {
    $: { name: string; classname?: string };
    failure?: string[];
    error?: string[];
    skipped?: unknown[];
    properties?: JUnitProperties[];
};

export type JUnitTestSuite = {
    $?: { name?: string; tests?: string; failures?: string; errors?: string; skipped?: string };
    testcase?: JUnitTestCase[];
    properties?: JUnitProperties[];
};

export const normalizeJUnitSuiteErrors = (suite: JUnitTestSuite): void => {
    const errorTestCases = suite.testcase?.filter(testCase => testCase.error !== undefined) ?? [];
    if (errorTestCases.length === 0) return;

    // The jest-junit reporter emits an error and a duplicate failure when a suite cannot load.
    const suiteErrors = errorTestCases.filter(
        testCase => testCase.$.classname === 'Test suite failed to run',
    );
    const testCases = (suite.testcase ?? []).filter(
        testCase =>
            testCase.error !== undefined ||
            testCase.failure === undefined ||
            !suiteErrors.some(
                suiteError =>
                    suiteError.$.name === testCase.$.name &&
                    suiteError.$.classname === testCase.$.classname,
            ),
    );

    testCases.forEach(testCase => {
        if (testCase.error === undefined) return;

        // Currents only recognizes <failure>; the original <error> holds the full Jest stack.
        testCase.failure = [...testCase.error, ...(testCase.failure ?? [])];
        delete testCase.error;
    });

    suite.testcase = testCases;
    suite.$ = {
        ...suite.$,
        tests: String(testCases.length),
        failures: String(testCases.filter(testCase => testCase.failure !== undefined).length),
        errors: '0',
        skipped: String(testCases.filter(testCase => testCase.skipped !== undefined).length),
    };
};
