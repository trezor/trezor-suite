import { TestCase } from '@playwright/test/reporter';

import { TestReportProviderBase, TestStatus, createTestAnnotation } from '@trezor/e2e-utils';

// Class used by our GitHub Reporter to extract metadata from the test and its run
export class TestReportProvider extends TestReportProviderBase {
    private readonly test: TestCase;

    constructor(test: TestCase) {
        super();
        this.test = test;

        for (const annotation of test.annotations) {
            if (!annotation.description) {
                continue;
            }
            this.annotationMap.set(annotation.type, annotation.description);
        }
    }

    // Platform-specific implementations
    get testTitle(): string {
        return this.test.title;
    }

    get testProject(): string {
        const project = this.test.parent.project();
        if (!project) {
            throw new Error('Test project is not available');
        }

        return project.name;
    }

    get status(): string {
        // This condition covers manual and automated tests that are skipped
        if (this.test.outcome() === 'skipped') {
            return TestStatus.Todo;
        }

        if (this.test.ok()) {
            return TestStatus.AutoPass;
        }

        if (!this.test.ok()) {
            return TestStatus.AutoFail;
        }

        return TestStatus.Todo;
    }

    get isManual(): boolean {
        return this.test.tags.some(tag => tag.startsWith('@group=manual'));
    }

    get isRetryAttempt(): boolean {
        return this.test.results.length > 1;
    }

    get id(): string {
        return this.test.id;
    }

    get filePath(): string {
        return this.test.location?.file || 'Path not available';
    }
}

export { createTestAnnotation };
