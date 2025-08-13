import type { Test, TestResult } from '@jest/reporters';
import * as fs from 'fs';
import * as path from 'path';

import { GitHubReporterBase, LoggingFunctions, TestDetailsAnnotation } from '@trezor/e2e-utils';

import { TestReportProvider } from './annotations';

const METADATA_DIR = path.join(process.cwd(), '.metadata');

class GitHubReporter extends GitHubReporterBase implements LoggingFunctions {
    async onRunStart() // aggregatedResults: AggregatedResult,
    // options: { estimatedTime: number },
    : Promise<void> {
        this.log('GitHub reporter started.');
        await this.initiateOctokitCommonJS();
        await this.init();
        // this.log(`onRunStart aggregatedResults: ${JSON.stringify(aggregatedResults, null, 2)}`);
    }

    onTestResult(_test: Test, testResult: TestResult): Promise<void> {
        const testTitle = testResult.testResults[0]?.title;
        this.log(`Processing test end for "${testTitle}"`);
        const metadata = this.readMetadataForTest(testTitle);
        this.log(`Metadata for test "${testTitle}":`, metadata);

        return this.trackOperation(
            (async () => {
                await this.waitForOnBeginInit();
                const report = new TestReportProvider(testResult, metadata);

                try {
                    if (
                        report.isRetryAttempt &&
                        this.createdIssuesMap.has(testResult.testFilePath)
                    ) {
                        await this.updateIssue(testResult, report);
                    } else {
                        await this.createIssuePerOs(testResult, report);
                    }
                } catch (error) {
                    this.logError(`Failed to process test end for "${testTitle}":`, error);
                    // Non-Critical error, no need to rethrow
                }
            })(),
        );
    }

    onRunComplete() // testContexts: Set<TestContext>,
    // aggregatedResult: AggregatedResult,
    : void | Promise<void> {
        this.log('Run complete');
        // this.log(`Aggregated result: ${JSON.stringify(aggregatedResult, null, 2)}`);
        this.log('Test contexts:');
        // testContexts.forEach(context => {
        //     this.log(`- ${context.config.id}: ${JSON.stringify(context, null, 2)}`);
        // });
    }

    async createIssuePerOs(test: TestResult, report: TestReportProvider) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.log(`Creating issue for test "${test.testFilePath}" with report:`, report);
        throw new Error('Method not implemented.');
    }

    async updateIssue(test: TestResult, report: TestReportProvider) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.log(`Updating issue for test "${test.testFilePath}" with report:`, report);
        throw new Error('Method not implemented.');
    }

    readMetadataForTest(name: string): TestDetailsAnnotation[] {
        const safeName = Buffer.from(name).toString('base64');
        const filePath = path.join(METADATA_DIR, `${safeName}.json`);
        try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            this.log(`Metadata: ${JSON.parse(raw)}`);

            return JSON.parse(raw);
        } catch {
            this.log(`No metadata found for test: ${name}`);
            this.log(`Expected file at: ${filePath}`);

            return [];
        }
    }
}

module.exports = GitHubReporter;
