import type { Octokit } from '@octokit/rest';

import { scheduleAction } from '@trezor/utils';

import { ProjectRequests } from './projectRequests';
import { LoggingFunctions } from './types';
import { BaseAnnotation, annotationsForProjectFields } from '../enums/testAnnotations';

const ORGANIZATION = 'trezor';
const ORG_ID = 'MDEyOk9yZ2FuaXphdGlvbjQxNDY0NDc=';
const QA_TEAM_ID = 'T_kwDOAD9FD84AMZXd';
// DevOps is working on tokens in our GitHub atm. Once that is settled we can rework this
// and try to create project separately for each build. Needs to be discussed with DevOps.
// And we would need to some kind of cleanup after each build of projects not longer used.
// Until then we will use one project for all builds and have name hardcoded here.
// We should first try this approach and get feedback from QA after one release.
const PROJECT_NAME = 'Trezor Suite release testing';
const RETRY_CONF = {
    attempts: 3,
    gap: 500,
};

export class GitHubProject {
    private _projectId: string | undefined;
    private graphQLClient: ProjectRequests;

    constructor(
        octokit: Octokit,
        private readonly logger: LoggingFunctions,
    ) {
        this.graphQLClient = new ProjectRequests(octokit, logger);
    }

    get id(): string {
        if (!this._projectId) {
            throw new Error('Project ID is not set. Ensure onBegin() is called first.');
        }

        return this._projectId;
    }

    // GraphQL requests require token with permissions `project, read:org`
    async init(): Promise<void> {
        try {
            const existingProject = await this.findExistingProject();

            if (existingProject) {
                this._projectId = existingProject.id;
                this.logger.log(
                    `Using existing project: ${existingProject.title} (${existingProject.id})`,
                );

                return;
            } else {
                this.logger.logError(`No existing project found.`);
                throw new Error('No existing project found.');
            }

            // We cannot get atm right token to be able to create project from Github Actions
            // await this.createProject(annotationsForProjectFields);

            // // Instead of taking projectId from 'createProject()' we run another 'findExistingProject()' query again
            // // Goal is to avoid conflicts by searching for the project again, by its name and choosing the oldest
            // // Source of conflict: Parallel workflows on CI (Web x Desktop), parallel groups in one workflow
            // const createdProject = await this.findExistingProject();
            // if (createdProject) {
            //     this._projectId = createdProject.id;
            //     this.logger.log(
            //         `Using created project: ${createdProject.title} (${createdProject.id})`,
            //     );

            //     return;
            // } else {
            //     throw new Error('Failed to find the created project');
            // }
        } catch (error) {
            this.logger.logError('Project initialization failed.');
            throw error;
        }
    }

    private async findExistingProject(): Promise<{ id: string; title: string } | null> {
        try {
            const projects = await scheduleAction(
                () => this.graphQLClient.getProjectFromOrganization(ORGANIZATION, PROJECT_NAME),
                RETRY_CONF,
            );

            const matchingProject = projects.find((project: any) => project.title === PROJECT_NAME);

            if (!matchingProject) {
                return null;
            }

            const areThereDuplicates =
                projects.filter((project: any) => project.title === PROJECT_NAME).length > 1;
            if (areThereDuplicates) {
                this.logger.log(
                    `Warning: Multiple projects found with title "${PROJECT_NAME}". Using the first one with number ${matchingProject.number}.`,
                );
            }

            return matchingProject;
        } catch (error) {
            this.logger.logError('Failed to find project.');
            throw error;
        }
    }

    async createProject(): Promise<void> {
        const projectId = await scheduleAction(
            () => this.graphQLClient.createProject(ORG_ID, QA_TEAM_ID, PROJECT_NAME),
            RETRY_CONF,
        );

        // Get default STATUS field that was automatically created.
        const existingFields = await scheduleAction(
            () => this.graphQLClient.getProjectFields(projectId),
            RETRY_CONF,
        );
        const existingStatusField = existingFields.find(f => f.name === 'Status');

        for (const desiredField of annotationsForProjectFields) {
            // Update STATUS field with new options
            if (desiredField.name === 'Status' && existingStatusField) {
                this.logger.log('Status field already exists, updating options...');
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

                await scheduleAction(
                    () =>
                        this.graphQLClient.createProjectField(
                            projectId,
                            desiredField.name,
                            desiredField.valueType,
                            desiredOptions,
                        ),
                    RETRY_CONF,
                );
            } catch (error) {
                this.logger.logError(`Error creating field "${desiredField.name}".`);
                throw error;
            }
        }
    }

    async updateProjectFieldOptions(fieldId: string, desiredField: BaseAnnotation): Promise<void> {
        this.logger.log(`Updating field options for "${desiredField.name}" (${fieldId})`);

        try {
            const desiredOptions = desiredField.valueOptions!.map(value => {
                const color = desiredField.optionsColors?.[value] || 'GRAY';

                return { value, color };
            });

            await scheduleAction(
                () => this.graphQLClient.updateFieldOptions(fieldId, desiredOptions),
                RETRY_CONF,
            );
            this.logger.log(`Successfully updated options for field "${desiredField.name}"`);
        } catch (error) {
            this.logger.logError(`Failed to update options for field "${desiredField.name}".`);
            throw error;
        }
    }
}
