import type { TestResult } from '@jest/reporters';

import { TestDetailsAnnotation, TestReportProviderBase, TestStatus } from '@trezor/e2e-utils';

// Class used by our GitHub Reporter to extract metadata from the test and its run
export class TestReportProvider extends TestReportProviderBase {
    private readonly test: TestResult;

    constructor(test: TestResult, metadata: TestDetailsAnnotation[]) {
        super();
        this.test = test;

        for (const annotation of metadata) {
            if (!annotation.description) {
                continue;
            }
            this.annotationMap.set(annotation.type, annotation.description);
        }
    }

    // Platform-specific implementations
    get testTitle(): string {
        if (!this.test.testResults.length) {
            throw new Error('Test results are empty');
        }

        return this.test.testResults[0]?.title;
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

        if (this.test.testResults[0]?.status === 'passed') {
            return TestStatus.AutoPass;
        }

        if (this.test.testResults[0]?.status === 'failed') {
            return TestStatus.AutoFail;
        }

        return TestStatus.Todo;
    }

    get isManual(): boolean {
        // Jest does not support any reasonable tagging that would be accessible in reports
        return this.test.testFilePath.includes('/manual/');
    }

    get isRetryAttempt(): boolean {
        return this.test.testResults.length > 1;
    }

    get id(): string {
        // For Jest/Native, we use testFilePath as the unique identifier
        return this.test.testFilePath;
    }

    get getTestFilePath(): string {
        return this.test.testFilePath;
    }
}
