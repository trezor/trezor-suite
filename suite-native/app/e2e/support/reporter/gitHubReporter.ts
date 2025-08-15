import type { Test, TestResult } from '@jest/reporters';

import { GitHubReporterBase, LoggingFunctions } from '@trezor/e2e-utils';

import { TestReportProvider } from './annotations';
import { readMetadataForTest } from '../metadataIO';

class GitHubReporter extends GitHubReporterBase implements LoggingFunctions {
    // Initializes the reporter when test run begins, creates a GitHub project if it doesn't exist
    async onRunStart(): Promise<void> {
        await this.initiateOctokitCommonJS();
        await this.init();
    }

    // Processes test completion by creating a GitHub issue with test results and metadata
    // eslint-disable-next-line require-await
    async onTestResult(_test: Test, testResult: TestResult): Promise<void> {
        const testTitle = testResult.testResults[0]?.title;
        this.log(`Processing test end for "${testTitle}"`);
        const metadata = readMetadataForTest(testTitle);
        // this.log(`Metadata for test "${testTitle}":`, metadata);
        const report = new TestReportProvider(testResult, metadata);

        return this.processTestResult(report);
    }

    async onRunComplete(): Promise<void> {
        await this.conclude();
    }
}

module.exports = GitHubReporter;
