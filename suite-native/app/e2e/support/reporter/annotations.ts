import type { TestResult } from '@jest/reporters';

import { TestDetailsAnnotation, TestReportProviderBase, TestStatus } from '@trezor/e2e-utils';

// Class used by our GitHub Reporter to extract metadata from the test and its run
export class TestReportProvider extends TestReportProviderBase {
    private readonly test: TestResult;
    private readonly assertionResult: TestResult['testResults'][number];

    constructor(
        test: TestResult,
        assertionResult: TestResult['testResults'][number],
        metadata: TestDetailsAnnotation[],
    ) {
        super();
        this.test = test;
        this.assertionResult = assertionResult;

        for (const annotation of metadata) {
            if (!annotation.description) {
                continue;
            }
            this.annotationMap.set(annotation.type, annotation.description);
        }
    }

    // Platform-specific implementations
    get testTitle(): string {
        return this.assertionResult.title;
    }

    get testProject(): string {
        // TODO: Get information Android vs iOS
        return 'Native';
    }

    get status(): string {
        // This condition covers manual and automated tests that are skipped
        if (this.test.skipped) {
            return TestStatus.Todo;
        }

        if (this.assertionResult.status === 'passed') {
            return TestStatus.AutoPass;
        }

        if (this.assertionResult.status === 'failed') {
            return TestStatus.AutoFail;
        }

        return TestStatus.Todo;
    }

    get isManual(): boolean {
        // Jest does not support any reasonable tagging that would be accessible in reports
        return this.test.testFilePath.includes('/manual/');
    }

    get isRetryAttempt(): boolean {
        return (this.assertionResult.invocations ?? 1) > 1;
    }

    get id(): string {
        // For Jest/Native, combine file path and full test title to uniquely identify test case.
        return `${this.test.testFilePath}::${this.assertionResult.fullName}`;
    }

    get filePath(): string {
        return this.test.testFilePath;
    }
}
