import type { Octokit } from '@octokit/rest';
import { Reporter, TestCase } from '@playwright/test/reporter';

import { scheduleAction } from '@trezor/utils';

import { TestReportProvider } from './annotations';
import { GitHubProject } from './gitHubProject';
import { IssueRequests } from './issueRequests';
import { LoggingFunctions, ProjectField } from './types';
import { statusAnnotation } from '../enums/testAnnotations';

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
    private pendingOperations: Promise<any>[] = [];
    private cachedFields: ProjectField[] | null = null;
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
                        await this.createIssue(test, report);
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

    private async createIssue(test: TestCase, report: TestReportProvider): Promise<void> {
        const issueNodeId = await scheduleAction(() => {
            this.log(`Creating GitHub draft issue for test "${test.title}"...`);

            return this.issueRequests.createDraftIssueInProject(
                this.gitHubProject.id,
                report.testCase,
                report.bodyDescription,
            );
        }, RETRY_CONF);

        this.createdIssuesMap.set(test.id, issueNodeId);
        this.log(`[${issueNodeId}] Successfully created issue "${test.title}"`);

        const fields = await scheduleAction(() => this.getProjectFields(), RETRY_CONF);

        for (const { name, value } of report.projectValues) {
            const { fieldId, valueOrOptionId } = this.resolveFieldAndValue(fields, name, value);
            await scheduleAction(() => {
                this.log(`[${issueNodeId}] Updating field ${name}:"${value}"...`);

                return this.issueRequests.setItemValue(
                    this.gitHubProject.id,
                    issueNodeId,
                    fieldId,
                    valueOrOptionId,
                );
            }, RETRY_CONF);
            this.log(`[${issueNodeId}] Successfully updated field ${name}:"${value}"`);
        }

        this.log(`[${issueNodeId}] Successfully recorded test result for "${test.title}"`);
    }

    private async updateIssue(test: TestCase, report: TestReportProvider): Promise<void> {
        const issueNodeId = this.createdIssuesMap.get(test.id);
        if (!issueNodeId) {
            throw new Error(`Issue ID not found for test retried test "${test.title}"`);
        }
        this.log(
            `[${issueNodeId}] Updating GitHub draft issue with a retry of test "${test.title}"...`,
        );

        const fields = await scheduleAction(() => this.getProjectFields(), RETRY_CONF);

        this.log(`[${issueNodeId}] Updating field Status:"${report.status}"...`);
        const { fieldId: statusFieldId, valueOrOptionId: statusOptionId } =
            this.resolveFieldAndValue(fields, statusAnnotation.name, report.status);
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

    private async getProjectFields(): Promise<ProjectField[]> {
        if (this.cachedFields) {
            return this.cachedFields;
        }

        this.log(`Fetching fields for project ${this.gitHubProject.id}...`);
        const fields = await this.issueRequests.getProjectFields(this.gitHubProject.id);
        this.log(`Successfully retrieved fields for project ${this.gitHubProject.id}`);
        this.cachedFields = fields;

        return fields;
    }

    private resolveFieldAndValue(
        fields: ProjectField[],
        name: string,
        value: string,
    ): { fieldId: string; valueOrOptionId: string } {
        const field = fields.find(f => f.name === name);

        if (!field) {
            throw new Error(
                `Field "${name}" not found in project fields: \n ${JSON.stringify(fields, null, 2)}`,
            );
        }

        if (field.dataType === 'SINGLE_SELECT' && field.options) {
            const option = field.options.find(opt => opt.name === value);
            if (!option) {
                throw new Error(
                    `Value "${value}" not found in field "${name}". Options: \n ${JSON.stringify(field.options, null, 2)}`,
                );
            }

            return {
                fieldId: field.id,
                valueOrOptionId: `{ singleSelectOptionId: "${option.id}" }`,
            };
        }

        // Currently we support only SINGLE_SELECT and TEXT fields
        return { fieldId: field.id, valueOrOptionId: `{ text: "${value}" }` };
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
