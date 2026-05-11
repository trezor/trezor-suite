import type { Octokit } from '@octokit/rest';

import { getWeakRandomInt, resolveAfter, scheduleAction, unique } from '@trezor/utils';

import { type TestReportProviderBase } from './annotationBase';
import { GitHubProject } from './gitHubProject';
import { IssueRequests } from './issueRequests';
import { type LoggingFunctions, type ProjectField } from './types';
import {
    TestOsEmoticons,
    type TestOsMatrix,
    TestStatus,
    osMatrixAnnotation,
    statusAnnotation,
} from '../enums/testAnnotations';

export const RETRY_CONF = {
    attempts: 5,
    gap: 500,
};
const LOG_VISUAL_SEPARATOR = '='.repeat(80);

enum InitializationState {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

abstract class GitHubReporterBase implements LoggingFunctions {
    protected _octokit: Octokit | null = null;
    protected _issueRequests: IssueRequests | null = null;
    protected _gitHubProject: GitHubProject | null = null;
    protected _fieldsInGitHub: ProjectField[] | null = null;
    protected pendingOperations: Promise<any>[] = [];
    protected initState: InitializationState = InitializationState.NOT_STARTED;
    protected createdIssuesMap: Map<string, string> = new Map();
    protected failedTestFilenames: string[] = [];

    protected initializationPromise: Promise<void> | null = null;

    protected get octokit(): Octokit {
        if (!this._octokit) {
            throw new Error(
                'Octokit instance is not initialized. Ensure onBegin() is called first.',
            );
        }

        return this._octokit;
    }

    protected get issueRequests(): IssueRequests {
        if (!this._issueRequests) {
            throw new Error('GraphQL client is not initialized. Ensure onBegin() is called first.');
        }

        return this._issueRequests;
    }

    protected get gitHubProject(): GitHubProject {
        if (!this._gitHubProject) {
            throw new Error('GitHub project is not initialized. Ensure onBegin() is called first.');
        }

        return this._gitHubProject;
    }

    protected get fieldsInGitHub(): ProjectField[] {
        if (!this._fieldsInGitHub) {
            throw new Error(
                'Project fields are not initialized. Ensure onBegin() is called first.',
            );
        }

        return this._fieldsInGitHub;
    }

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

    protected logInstructionsForRerun(): void {
        const failedCount = this.failedTestFilenames.length;
        const uniqueFailedFilenames = unique(this.failedTestFilenames);

        this.logError(LOG_VISUAL_SEPARATOR);
        this.logError(`GITHUB REPORTER SUMMARY: ~${failedCount} test(s) failed to report`);
        this.logError(LOG_VISUAL_SEPARATOR);

        if (process.env.RELEASE_BUILD) {
            this.logError(`Release Build: ${process.env.RELEASE_BUILD}`);
        }

        this.logError(`To rerun the reporter for these specific tests:`);
        this.logError(
            `1. Navigate to: https://github.com/trezor/trezor-suite/actions/workflows/test-suite-manual-release.yml`,
        );
        this.logError(`2. Click "Run workflow"`);
        this.logError(`3. Specify your release branch`);
        this.logError(`4. In the 'testFilter' parameter, paste the following:`);
        this.logError(`   ${uniqueFailedFilenames.join(' ')}`);
        this.logError(LOG_VISUAL_SEPARATOR);
    }

    // Tracks asynchronous operations and logs their completion
    // Otherwise, playwright would not wait for them to finish
    protected trackOperation<T>(operation: Promise<T>): Promise<T> {
        this.pendingOperations.push(operation);

        return operation.finally(() => {
            const index = this.pendingOperations.indexOf(operation);
            if (index !== -1) {
                this.pendingOperations.splice(index, 1);
                this.log(`Operation completed (${this.pendingOperations.length} remaining)`);
            }
        });
    }

    protected async initiateOctokitESM(): Promise<void> {
        this.log('GitHub reporter started. Initializing Octokit (ESM)...');
        this.initState = InitializationState.IN_PROGRESS;
        try {
            const OctokitModule = await import('@octokit/rest');
            this._octokit = new OctokitModule.Octokit({ auth: process.env.GITHUB_TOKEN });
        } catch (error) {
            this.initState = InitializationState.FAILED;
            this.logError('Failed to initialize Octokit.');
            throw error; // Critical error, rethrow to stop execution
        }
    }

    protected async initiateOctokitCommonJS(): Promise<void> {
        this.log('GitHub reporter started. Initializing Octokit (CommonJS)...');
        this.initState = InitializationState.IN_PROGRESS;
        try {
            const importDynamic = new Function('specifier', 'return import(specifier)');
            const octokitModule = await importDynamic('@octokit/rest');
            this._octokit = new octokitModule.Octokit({ auth: process.env.GITHUB_TOKEN });
        } catch (error) {
            this.initState = InitializationState.FAILED;
            this.logError('Failed to initialize Octokit.');
            throw error; // Critical error, rethrow to stop execution
        }
    }

    protected init() {
        this.log('GitHub reporter started. Initializing GitHub client...');
        const initPromise = (async () => {
            try {
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

    // eslint-disable-next-line require-await
    protected async processTestResult(report: TestReportProviderBase): Promise<void> {
        return this.trackOperation(
            (async () => {
                try {
                    await this.waitForOnBeginInit();

                    if (report.isRetryAttempt && this.createdIssuesMap.has(report.id)) {
                        // Retry attempts update the existing issue instead of creating a new one
                        await this.updateIssue(report);
                    } else if (!report.isManual && report.status === TestStatus.AutoPass) {
                        this.log(
                            `Skipping reporting because test is automated and passed: "${report.testTitle}"`,
                        );

                        return;
                    } else {
                        // Otherwise, create a new issue(s)
                        await this.createIssuePerOs(report);
                    }
                } catch (error) {
                    this.logError(`Failed to process test end for "${report.testTitle}":`, error);
                    this.failedTestFilenames.push(report.filename);
                    // Non-Critical error, no need to rethrow
                }
            })(),
        );
    }

    protected async conclude() {
        this.log('All tests completed, waiting for pending operations...');

        if (this.pendingOperations.length > 0) {
            this.log(`Waiting for ${this.pendingOperations.length} pending operations to complete`);

            const results = await Promise.allSettled(this.pendingOperations);
            const failed = results.filter(r => r.status === 'rejected');

            if (failed.length > 0) {
                this.logError(`${failed.length} operations failed`);
                failed.forEach((result, index) => {
                    this.logError(`Operation ${index + 1} failed:`, result.reason);
                });
            } else {
                this.log('All pending operations finished');
            }
        } else {
            this.log('No pending operations to wait for');
        }

        if (this.initState !== 'COMPLETED') {
            this.logError(
                `Conclude(): Initialization not completed successfully. State: ${this.initState}`,
            );
            throw new Error('GitHub reporter finished with failure (not initialized)');
        }
        if (this.failedTestFilenames.length > 0) {
            this.logInstructionsForRerun();
            throw new Error('GitHub reporter finished with failure');
        }
        this.log('GitHub reporter finished successfully');
    }

    protected async getProjectFields() {
        this.log(`Fetching fields for project ${this.gitHubProject.id}...`);
        this._fieldsInGitHub = await this.issueRequests.getProjectFields(this.gitHubProject.id);
        this.log(`Successfully retrieved fields for project ${this.gitHubProject.id}`);
    }

    // Looks in project for filedId and OptionId for a specific values the test have.
    // These Ids are used to update the issue with values like status, stream, etc.
    protected resolveFieldAndValue(
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

    protected async waitForOnBeginInit(): Promise<void> {
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

    protected async updateIssue(report: TestReportProviderBase): Promise<void> {
        const issueNodeId = this.createdIssuesMap.get(report.id);
        if (!issueNodeId) {
            throw new Error(`Issue ID not found for test retried test "${report.testTitle}"`);
        }
        this.log(
            `[${issueNodeId}] Updating GitHub draft issue with a retry of test "${report.testTitle}"...`,
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
        this.log(`[${issueNodeId}] Successfully updated test result for "${report.testTitle}"`);
    }

    protected async createIssuePerOs(report: TestReportProviderBase): Promise<void> {
        if (!report.osMatrix || report.osMatrix.length === 0) {
            throw new Error(`No OS matrix found for test "${report.testTitle}"`);
        }

        for (const operationSystem of report.osMatrix) {
            const issueNodeId = await scheduleAction(async () => {
                // Random delay between 1-5 seconds to distribute load on GitHub API
                // Without it we often hit "Your attempt to move this item created a temporary conflict. Please try again"
                const randomDelay = getWeakRandomInt(1000, 5000); // 1000-4999ms
                await resolveAfter(randomDelay);
                this.log(
                    `Creating GitHub draft issue for test "(OS ${operationSystem}) ${report.testTitle}"...`,
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

            if (!issueNodeId) {
                throw new Error(
                    `Draft issue creation returned no id for "(OS ${operationSystem}) ${report.testTitle}"`,
                );
            }

            this.createdIssuesMap.set(report.id, issueNodeId);
            this.log(
                `[${issueNodeId}] Successfully created issue "(OS ${operationSystem}) ${report.testTitle}"`,
            );

            const resolvedFieldsAndValues = report.projectValues.map(({ name, value }) =>
                this.resolveFieldAndValue(name, value, operationSystem),
            );
            await scheduleAction(() => {
                this.log(
                    `[${issueNodeId}] Updating values of issue "(OS ${operationSystem}) ${report.testTitle}"...`,
                );

                return this.issueRequests.setMultipleValues(
                    this.gitHubProject.id,
                    issueNodeId,
                    resolvedFieldsAndValues,
                );
            }, RETRY_CONF);

            this.log(
                `[${issueNodeId}] Successfully updated values of issue "(OS ${operationSystem}) ${report.testTitle}"`,
            );

            this.log(
                `[${issueNodeId}] Successfully recorded test result for "(OS ${operationSystem}) ${report.testTitle}"`,
            );
        }
    }
}

export { GitHubReporterBase, InitializationState };
