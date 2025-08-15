import { Reporter, TestCase } from '@playwright/test/reporter';

import { GitHubReporterBase, LoggingFunctions } from '@trezor/e2e-utils';

import { TestReportProvider } from './annotations';

class GitHubReporter extends GitHubReporterBase implements Reporter, LoggingFunctions {
    // Initializes the reporter when test run begins, creates a GitHub project if it doesn't exist
    async onBegin() {
        await this.initiateOctokitESM();
        await this.init();
    }

    // Processes test completion by creating a GitHub issue with test results and metadata
    // eslint-disable-next-line require-await
    async onTestEnd(test: TestCase) {
        this.log(`Processing test end for "${test.title}"`);
        const report = new TestReportProvider(test);

        return this.processTestResult(report);
    }

    // Finalizes reporting when all tests are complete, waits for pending operations to finish

    async onEnd() {
        await this.conclude();
    }
}

// eslint-disable-next-line import/no-default-export
export default GitHubReporter;
