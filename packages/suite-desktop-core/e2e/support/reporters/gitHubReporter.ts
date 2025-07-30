import { Reporter, TestCase } from '@playwright/test/reporter';

import {
    GitHubReporterBase,
    LoggingFunctions,
    TestOsEmoticons,
    TestOsMatrix,
    statusAnnotation,
} from '@trezor/e2e-utils';
import { RETRY_CONF } from '@trezor/e2e-utils/src/githubReporter/gitHubReporterBase';
import { scheduleAction } from '@trezor/utils';

import { TestReportProvider } from './annotations';

class GitHubReporter extends GitHubReporterBase implements Reporter, LoggingFunctions {
    // Initializes the reporter when test run begins, creates a GitHub project if it doesn't exist

    async onBegin() {
        await this.init();
    }

    // Processes test completion by creating a GitHub issue with test results and metadata
    // eslint-disable-next-line require-await
    async onTestEnd(test: TestCase) {
        this.log(`Processing test end for "${test.title}"`);

        return this.trackOperation(
            (async () => {
                await this.waitForOnBeginInit();
                const report = new TestReportProvider(test);

                try {
                    if (report.isRetryAttempt && this.createdIssuesMap.has(test.id)) {
                        await this.updateIssue(test, report);
                    } else {
                        await this.createIssuePerOs(test, report);
                    }
                } catch (error) {
                    this.logError(`Failed to process test end for "${test.title}":`, error);
                    // Non-Critical error, no need to rethrow
                }
            })(),
        );
    }

    // Finalizes reporting when all tests are complete, waits for pending operations to finish
    // eslint-disable-next-line require-await
    async onEnd() {
        this.log('All tests completed, waiting for pending operations...');

        if (this.pendingOperations.length > 0) {
            this.log(`Waiting for ${this.pendingOperations.length} pending operations to complete`);

            return Promise.allSettled(this.pendingOperations)
                .then(results => {
                    const failed = results.filter(r => r.status === 'rejected').length;
                    if (failed > 0) {
                        this.logError(`${failed} operations failed`);
                    } else {
                        this.log('All operations completed successfully');
                    }
                })
                .finally(() => {
                    this.log('GitHub reporter finished');
                });
        } else {
            this.log('No pending operations, GitHub reporter finished');

            return Promise.resolve();
        }
    }

    private async updateIssue(test: TestCase, report: TestReportProvider): Promise<void> {
        const issueNodeId = this.createdIssuesMap.get(test.id);
        if (!issueNodeId) {
            throw new Error(`Issue ID not found for test retried test "${test.title}"`);
        }
        this.log(
            `[${issueNodeId}] Updating GitHub draft issue with a retry of test "${test.title}"...`,
        );

        this.log(`[${issueNodeId}] Updating field Status:"${report.status}"...`);
        const { fieldId: statusFieldId, valueOrOptionId: statusOptionId } =
            this.resolveFieldAndValue(statusAnnotation.name, report.status);
        await scheduleAction(
            () =>
                this.issueRequests.setItemValue(
                    this.gitHubProject.id,
                    issueNodeId,
                    statusFieldId,
                    statusOptionId,
                ),
            RETRY_CONF,
        );
        this.log(`[${issueNodeId}] Successfully updated field Status:"${report.status}"`);
        this.log(`[${issueNodeId}] Successfully updated test result for "${test.title}"`);
    }

    private async createIssuePerOs(test: TestCase, report: TestReportProvider): Promise<void> {
        for (const operationSystem of report.osMatrix) {
            const issueNodeId = await scheduleAction(() => {
                this.log(
                    `Creating GitHub draft issue for test "(OS ${operationSystem}) ${test.title}"...`,
                );

                const titleWithOptionalEmoticons = report.useOsEmoticons
                    ? `${TestOsEmoticons[operationSystem as TestOsMatrix]} ${report.testCase}`
                    : report.testCase;

                return this.issueRequests.createDraftIssueInProject(
                    this.gitHubProject.id,
                    titleWithOptionalEmoticons,
                    report.bodyDescription,
                );
            }, RETRY_CONF);

            this.createdIssuesMap.set(test.id, issueNodeId);
            this.log(
                `[${issueNodeId}] Successfully created issue "(OS ${operationSystem}) ${test.title}"`,
            );

            const resolvedFieldsAndValues = report.projectValues.map(({ name, value }) =>
                this.resolveFieldAndValue(name, value, operationSystem),
            );
            await scheduleAction(() => {
                this.log(
                    `[${issueNodeId}] Updating values of issue "(OS ${operationSystem}) ${test.title}"...`,
                );

                return this.issueRequests.setMultipleValues(
                    this.gitHubProject.id,
                    issueNodeId,
                    resolvedFieldsAndValues,
                );
            }, RETRY_CONF);

            this.log(
                `[${issueNodeId}] Successfully updated values of issue "(OS ${operationSystem}) ${test.title}"`,
            );

            this.log(
                `[${issueNodeId}] Successfully recorded test result for "(OS ${operationSystem}) ${test.title}"`,
            );
        }
    }
}

// eslint-disable-next-line import/no-default-export
export default GitHubReporter;
