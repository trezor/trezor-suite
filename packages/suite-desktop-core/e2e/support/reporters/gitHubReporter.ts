import { Octokit } from '@octokit/rest';
import { Reporter, TestCase } from '@playwright/test/reporter';

import { TestReportProvider } from '../annotations';
import { GitHubGraphQLClient } from './gitHubGraphQLClient';
import { LoggingFunctions, ProjectField } from './types';
import { BaseAnnotation, annotationsForProjectFields } from '../enums/testAnnotations';

// Constants
const ownerLogin = 'Vere-Grey';
const ownerId = 'MDQ6VXNlcjczODM2MjY5';
const repoName = 'exercism_dominoes';
// const repoId = 'R_kgDOG5BJRw';
// const organization = 'trezor';
//TODO: Run over Test Results which has wrong fields and fix double error in term
const projectName = 'Test Results 22';
const VERBOSE = true;

class GitHubTicketReporter implements Reporter, LoggingFunctions {
    private _octokit: Octokit | null = null;
    private _projectId: string | undefined;
    private _graphQLClient: GitHubGraphQLClient | null = null;
    private pendingOperations: Promise<any>[] = [];
    private cachedFields: ProjectField[] | null = null;
    private initializationPromise: Promise<void> | null = null;

    log(...args: any[]): void {
        if (VERBOSE) {
            console.warn('[GitHub Reporter]', ...args);
        }
    }

    logError(...args: any[]): void {
        console.error('[GitHub Reporter ERROR]', ...args);
    }

    logResponse(label: string, response: any): void {
        if (VERBOSE) {
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

    private get graphQLClient(): GitHubGraphQLClient {
        if (!this._graphQLClient) {
            throw new Error('GraphQL client is not initialized. Ensure onBegin() is called first.');
        }

        return this._graphQLClient;
    }

    private get projectId(): string {
        if (!this._projectId) {
            throw new Error('Project ID is not set. Ensure onBegin() is called first.');
        }

        return this._projectId;
    }

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

    // eslint-disable-next-line require-await
    async onBegin() {
        const initPromise = (async () => {
            try {
                const OctokitModule = await import('@octokit/rest');
                this._octokit = new OctokitModule.Octokit({ auth: process.env.GITHUB_TOKEN });
                this._graphQLClient = new GitHubGraphQLClient(this.octokit, this);
                this.log('GitHub client initialized successfully');
            } catch (error) {
                this.logError('Failed to initialize GitHub reporter.');
                throw error; // Critical error, rethrow to stop execution
            }

            await this.initializeProject();
        })();
        this.initializationPromise = initPromise;

        return this.trackOperation(initPromise);
    }

    // eslint-disable-next-line require-await
    async onTestEnd(test: TestCase) {
        this.log(`Processing test end for "${test.title}"`);

        return this.trackOperation(
            (async () => {
                if (this.initializationPromise) {
                    await this.initializationPromise;
                }

                const report = new TestReportProvider(test);

                try {
                    const issueNodeId = await this.createIssue(report);
                    const projectItemId = await this.graphQLClient.addIssueToProject(
                        this.projectId,
                        issueNodeId,
                    );

                    const fields = await this.getProjectFields();
                    for (const { name, value } of report.projectValues) {
                        const { fieldId, valueOrOptionId } = this.resolveFieldAndValue(
                            fields,
                            name,
                            value,
                        );
                        await this.graphQLClient.setItemValue(
                            this.projectId,
                            projectItemId,
                            fieldId,
                            valueOrOptionId,
                        );
                    }

                    this.log(`Successfully recorded test result for "${test.title}"`);
                } catch (error) {
                    this.logError(`Failed to process test end for "${test.title}":`, error);
                    // Non-Critical error, no need to rethrow
                }
            })(),
        );
    }

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

    private async initializeProject(): Promise<void> {
        try {
            const existingProject = await this.findExistingProject();

            if (existingProject) {
                this._projectId = existingProject.id;
                this.log(
                    `Using existing project: ${existingProject.title} (${existingProject.id})`,
                );

                return;
            }

            await this.createProject(annotationsForProjectFields);

            // Finds the project again to avoid conflicts
            const createdProject = await this.findExistingProject();
            if (createdProject) {
                this._projectId = createdProject.id;
                this.log(`Using created project: ${createdProject.title} (${createdProject.id})`);

                return;
            } else {
                throw new Error('Failed to find the created project');
            }
        } catch (error) {
            this.logError('Project initialization failed.');
            throw error;
        }
    }

    private async findExistingProject(): Promise<{ id: string; title: string } | null> {
        try {
            const projects = await this.graphQLClient.getProjectFromUser(ownerLogin, projectName);
            // const projects =  this.graphQLClient.getProjectFromOrganization(organization, projectName));

            const matchingProject = projects.find((project: any) => project.title === projectName);

            if (matchingProject) {
                const areThereDuplicates =
                    projects.filter((project: any) => project.title === projectName).length > 1;
                if (areThereDuplicates) {
                    this.log(
                        `Warning: Multiple projects found with title "${projectName}". Using the first one.`,
                    );
                }

                return matchingProject;
            }

            return null;
        } catch (error) {
            this.logError('Failed to find project.');
            throw error;
        }
    }

    async createProject(desiredFields: Array<BaseAnnotation>): Promise<void> {
        const projectId = await this.graphQLClient.createProject(ownerId, projectName);

        // Get default STATUS field that was automatically created.
        const existingFields = await this.graphQLClient.getProjectFields(projectId);
        const existingStatusField = existingFields.find(f => f.name === 'Status');

        for (const desiredField of desiredFields) {
            // Update STATUS field with new options
            if (desiredField.name === 'Status' && existingStatusField) {
                this.log('Status field already exists, updating options...');
                await this.updateProjectFieldOptions(existingStatusField.id, desiredField);
                continue;
            }

            try {
                const desiredOptions =
                    desiredField.valueType === 'SINGLE_SELECT' && desiredField.valueOptions
                        ? desiredField.valueOptions.map(value => {
                              const color = desiredField.optionsColors?.[value] || 'GRAY';

                              return { value, color };
                          })
                        : undefined;

                await this.graphQLClient.createProjectField(
                    projectId,
                    desiredField.name,
                    desiredField.valueType,
                    desiredOptions,
                );
            } catch (error) {
                this.logError(`Error creating field "${desiredField.name}".`);
                throw error;
            }
        }
    }

    async updateProjectFieldOptions(fieldId: string, desiredField: BaseAnnotation): Promise<void> {
        this.log(`Updating field options for "${desiredField.name}" (${fieldId})`);

        try {
            const desiredOptions = desiredField.valueOptions!.map(value => {
                const color = desiredField.optionsColors?.[value] || 'GRAY';

                return { value, color };
            });

            await this.graphQLClient.updateFieldOptions(fieldId, desiredOptions);
            this.log(`Successfully updated options for field "${desiredField.name}"`);
        } catch (error) {
            this.logError(`Failed to update options for field "${desiredField.name}".`);
            throw error;
        }
    }

    private async createIssue(report: TestReportProvider): Promise<any> {
        this.log(`Creating GitHub issue for test "${report.testCase}"...`);

        try {
            const response = await this.octokit.issues.create({
                owner: ownerLogin,
                repo: repoName,
                title: report.testCase,
                body: report.bodyDescription,
                draft: true,
            });

            this.log(`Successfully created issue with Id: "${response.data.node_id}"`);

            return response.data.node_id;
        } catch (error) {
            this.logError(`Failed to create GitHub issue for test "${report.testCase}".`);
            throw error;
        }
    }

    private async getProjectFields(): Promise<ProjectField[]> {
        if (this.cachedFields) {
            this.log('Using cached project fields');

            return this.cachedFields;
        }

        const fields = await this.graphQLClient.getProjectFields(this.projectId);
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

        // We are assuming no other type that TEXT exists
        return { fieldId: field.id, valueOrOptionId: `{ text: "${value}" }` };
    }
}

// eslint-disable-next-line import/no-default-export
export default GitHubTicketReporter;
