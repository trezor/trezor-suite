import type { Octokit } from '@octokit/rest';
import { Reporter, TestCase } from '@playwright/test/reporter';

import { scheduleAction } from '@trezor/utils';

import { TestReportProvider } from './annotations';
import { GitHubProject } from './gitHubProject';
import { IssueRequests } from './issueRequests';
import { LoggingFunctions, ProjectField } from './types';
import {
    TestOsEmoticons,
    TestOsMatrix,
    osMatrixAnnotation,
    statusAnnotation,
} from '../enums/testAnnotations';

const RETRY_CONF = {
    attempts: 3,
    gap: 500,
};

enum InitializationState {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

class GitHubReporter implements Reporter, LoggingFunctions {
    private _octokit: Octokit | null = null;
    private _issueRequests: IssueRequests | null = null;
    private _gitHubProject: GitHubProject | null = null;
    private _fieldsInGitHub: ProjectField[] | null = null;
    private pendingOperations: Promise<any>[] = [];
    private initState: InitializationState = InitializationState.NOT_STARTED;
    private createdIssuesMap: Map<string, string> = new Map();

    private initializationPromise: Promise<void> | null = null;

    log(...args: any[]): void {
        if (process.env.GITHUB_REPORTER_VERBOSE) {
            console.warn('[GitHub Reporter]', ...args);
        }
    }

    logError(...args: any[]): void {
        console.error('[GitHub Reporter ERROR]', ...args);
    }

    logResponse(label: string, response: any): void {
        if (process.env.GITHUB_REPORTER_VERBOSE) {
            console.warn(`[GitHub Reporter] ${label}:`);
            console.warn(JSON.stringify(response, null, 2));
        }
    }

    private get octokit(): Octokit {
        if (!this._octokit) {
            throw new Error(
                'Octokit instance is not initialized. Ensure onBegin() is called first.',
            );
        }

        return this._octokit;
    }

    private get issueRequests(): IssueRequests {
        if (!this._issueRequests) {
            throw new Error('GraphQL client is not initialized. Ensure onBegin() is called first.');
        }

        return this._issueRequests;
    }

    private get gitHubProject(): GitHubProject {
        if (!this._gitHubProject) {
            throw new Error('GitHub project is not initialized. Ensure onBegin() is called first.');
        }

        return this._gitHubProject;
    }

    private get fieldsInGitHub(): ProjectField[] {
        if (!this._fieldsInGitHub) {
            throw new Error(
                'Project fields are not initialized. Ensure onBegin() is called first.',
            );
        }

        return this._fieldsInGitHub;
    }

    // Tracks asynchronous operations and logs their completion
    // Otherwise, playwright would not wait for them to finish
    private trackOperation<T>(operation: Promise<T>): Promise<T> {
        this.pendingOperations.push(operation);

        return operation.finally(() => {
            const index = this.pendingOperations.indexOf(operation);
            if (index !== -1) {
                this.pendingOperations.splice(index, 1);
                this.log(`Operation completed (${this.pendingOperations.length} remaining)`);
            }
        });
    }

    // Initializes the reporter when test run begins, creates a GitHub project if it doesn't exist
    // eslint-disable-next-line require-await
    async onBegin() {
        this.initState = InitializationState.IN_PROGRESS;
        const initPromise = (async () => {
            try {
                const OctokitModule = await import('@octokit/rest');
                this._octokit = new OctokitModule.Octokit({ auth: process.env.GITHUB_TOKEN });
                this._issueRequests = new IssueRequests(this.octokit);
                this._gitHubProject = new GitHubProject(this.octokit, this);
                this.log('GitHub client initialized successfully');
            } catch (error) {
                this.initState = InitializationState.FAILED;
                this.logError('Failed to initialize GitHub reporter.');
                throw error; // Critical error, rethrow to stop execution
            }

            try {
                await this.gitHubProject.init();
                await scheduleAction(() => this.getProjectFields(), RETRY_CONF);
                this.initState = InitializationState.COMPLETED;
            } catch (error) {
                this.initState = InitializationState.FAILED;
                this.logError('Failed to initialize GitHub Project.');
                throw error; // Critical error, rethrow to stop execution
            }
        })();
        this.initializationPromise = initPromise;

        return this.trackOperation(initPromise);
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

    private async getProjectFields() {
        this.log(`Fetching fields for project ${this.gitHubProject.id}...`);
        this._fieldsInGitHub = await this.issueRequests.getProjectFields(this.gitHubProject.id);
        this.log(`Successfully retrieved fields for project ${this.gitHubProject.id}`);
    }

    // Looks in project for filedId and OptionId for a specific values the test have.
    // These Ids are used to update the issue with values like status, stream, etc.
    private resolveFieldAndValue(
        fieldNameToResolve: string,
        fieldValueToResolve: string,
        operationSystem?: string,
    ): { fieldId: string; valueOrOptionId: string } {
        const resolvedField = this.fieldsInGitHub.find(f => f.name === fieldNameToResolve);

        if (!resolvedField) {
            throw new Error(
                `Field "${fieldNameToResolve}" not found in project fields: \n ${JSON.stringify(this.fieldsInGitHub, null, 2)}`,
            );
        }

        // resolve OS Matrix field specifically
        // When processing OS Matrix values, we need to use the current OS being processed
        // rather than the general field value from the test report. Since we create a new issue for each OS,
        const isResolvingOsMatrix =
            resolvedField.dataType === 'SINGLE_SELECT' &&
            fieldNameToResolve === osMatrixAnnotation.name;
        if (isResolvingOsMatrix && resolvedField.options) {
            const resolvedOsOption = resolvedField.options.find(
                opt => opt.name === operationSystem,
            );
            if (!resolvedOsOption) {
                throw new Error(
                    `Value "${operationSystem}" not found in field "${osMatrixAnnotation.name}". Options: \n ${JSON.stringify(resolvedField.options, null, 2)}`,
                );
            }

            return {
                fieldId: resolvedField.id,
                valueOrOptionId: `{ singleSelectOptionId: "${resolvedOsOption.id}" }`,
            };
        }

        // resolve SINGLE_SELECT field and value
        if (resolvedField.dataType === 'SINGLE_SELECT' && resolvedField.options) {
            const resolvedOption = resolvedField.options.find(
                opt => opt.name === fieldValueToResolve,
            );
            if (!resolvedOption) {
                throw new Error(
                    `Value "${fieldValueToResolve}" not found in field "${fieldNameToResolve}". Options: \n ${JSON.stringify(resolvedField.options, null, 2)}`,
                );
            }

            return {
                fieldId: resolvedField.id,
                valueOrOptionId: `{ singleSelectOptionId: "${resolvedOption.id}" }`,
            };
        }

        // resolve TEXT field. Currently we support only SINGLE_SELECT and TEXT fields. Text values are passed as is.
        return { fieldId: resolvedField.id, valueOrOptionId: `{ text: "${fieldValueToResolve}" }` };
    }

    private async waitForOnBeginInit(): Promise<void> {
        if (this.initState === InitializationState.COMPLETED) {
            return;
        }

        if (this.initState === InitializationState.FAILED) {
            throw new Error('GitHub reporter onBegin initialization failed previously');
        }

        if (this.initState === InitializationState.NOT_STARTED) {
            // Wait until state changes from NOT_STARTED to something else
            await new Promise<void>((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (this.initState !== InitializationState.NOT_STARTED) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Timed out waiting for onBegin initialization to start'));
                }, 30_000);
            });

            // Now state should be changed, call ensureInitialized again to handle the new state
            return this.waitForOnBeginInit();
        }

        if (this.initState === InitializationState.IN_PROGRESS && this.initializationPromise) {
            await this.initializationPromise;
        }
    }
}

// eslint-disable-next-line import/no-default-export
export default GitHubReporter;
