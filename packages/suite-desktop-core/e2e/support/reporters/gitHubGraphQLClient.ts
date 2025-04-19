import { Octokit } from '@octokit/rest';

import {
    AddIssueToProjectResponse,
    CreateFieldResponse,
    CreateProjectMutation,
    LoggingFunctions,
    Project,
    ProjectField,
    ProjectFieldsResponse,
    ProjectQueryResponse,
    ProjectQueryResponseUser,
    UpdateProjectItemFieldResponse,
    ValueOrOptionId,
} from './types';

export class GitHubGraphQLClient {
    constructor(
        private readonly octokit: Octokit,
        private readonly logger: LoggingFunctions,
    ) {}

    async createProject(ownerId: string, projectName: string): Promise<string> {
        this.logger.log(`Creating project with owner ID: ${ownerId}`);

        try {
            const mutation = `
                mutation {
                    createProjectV2(
                    input: {
                        ownerId: "${ownerId}"
                        title: "${projectName}"
                    }) {
                        projectV2 {
                            id
                        }
                    }
                }
            `;

            const response = await this.octokit.graphql<CreateProjectMutation>(mutation);
            const projectId = response.createProjectV2.projectV2.id;

            this.logger.log(`Created GitHub project with ID: ${projectId}`);

            return projectId;
        } catch (error) {
            this.logger.logError(`Failed to create project for owner ${ownerId}:`);
            throw error;
        }
    }

    async createProjectField(
        projectId: string,
        fieldName: string,
        fieldType: string,
        options?: { value: string; color: string }[],
    ): Promise<string> {
        const isSelectField = fieldType === 'SINGLE_SELECT';
        let optionsString = '';
        this.logger.log(
            `Creating ${fieldType} field "${fieldName}" in project ${projectId}${
                isSelectField ? ` with ${options!.length} options` : ''
            }...`,
        );

        try {
            if (isSelectField && options) {
                optionsString = options
                    .map(
                        opt =>
                            `{ name: "${opt.value}", description: "${opt.value}", color: ${opt.color} }`,
                    )
                    .join(',\n');
            }

            const mutation = `
          mutation {
            createProjectV2Field(
            input: {
              projectId: "${projectId}"
              name: "${fieldName}"
              dataType: ${fieldType}
              ${isSelectField ? `singleSelectOptions: [${optionsString}]` : ''}
            }) {
                projectV2Field {
                  ... on ProjectV2SingleSelectField {
                    id
                  }
                }
            } 
          }`;

            const response = await this.octokit.graphql<CreateFieldResponse>(mutation);
            const fieldId = response.createProjectV2Field.projectV2Field.id;
            this.logger.log(`Created ${fieldType} field "${fieldName}" with ID: ${fieldId}`);

            return fieldId;
        } catch (error) {
            this.logger.logError(`Failed to create ${fieldType} field "${fieldName}":`, error);
            throw error;
        }
    }

    async getProjectFromOrganization(
        organization: string,
        projectName: string,
    ): Promise<Project[]> {
        this.logger.log(`Fetching projects for organization: ${organization}`);

        try {
            const query = `
                query {
                  organization(login: "${organization}") {
                    projectsV2(first: 10, query: "${projectName}") {
                      nodes {
                        id
                        title
                      }
                    }
                  }
                }
            `;

            const response = await this.octokit.graphql<ProjectQueryResponse>(query);
            this.logger.log('Successfully retrieved organization projects');

            return response.organization.projectsV2.nodes;
        } catch (error) {
            this.logger.logError(`Failed to get projects for organization ${organization}:`);
            throw error;
        }
    }

    async getProjectFromUser(ownerLogin: string, projectName: string): Promise<Project[]> {
        this.logger.log(`Fetching projects for user: ${ownerLogin}`);

        try {
            const query = `
                query {
                  user(login: "${ownerLogin}") {
                    projectsV2(first: 10, query: "${projectName}") {
                      nodes {
                        id
                        title
                      }
                    }
                  }
                }
            `;

            const response = await this.octokit.graphql<ProjectQueryResponseUser>(query);
            this.logger.log('Successfully retrieved user projects');

            return response.user.projectsV2.nodes;
        } catch (error) {
            this.logger.logError(`Failed to get projects for user ${ownerLogin}:`);
            throw error;
        }
    }

    async addIssueToProject(projectId: string, issueNodeId: string): Promise<string> {
        this.logger.log(`Adding issue ${issueNodeId} to project ${projectId}...`);

        try {
            const mutation = `
                mutation {
                  addProjectV2ItemById(
                  input: {
                    projectId: "${projectId}"
                    contentId: "${issueNodeId}"
                  }) {
                    item {
                      id
                    }
                  }
                }
            `;

            const response = await this.octokit.graphql<AddIssueToProjectResponse>(mutation);

            return response.addProjectV2ItemById.item.id;
        } catch (error) {
            this.logger.logError('Failed to add issue to project:');
            throw error;
        }
    }

    async getProjectFields(projectId: string): Promise<ProjectField[]> {
        this.logger.log(`Fetching fields for project ${projectId}...`);

        try {
            const response = await this.octokit.graphql<ProjectFieldsResponse>(`
              query {
                node(id: "${projectId}") {
                  ... on ProjectV2 {
                    fields(first: 20) {
                      nodes {
                        ... on ProjectV2FieldCommon {
                          id
                          name
                          dataType
                        }
                        ... on ProjectV2SingleSelectField {
                          id
                          name
                          dataType
                          options {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
          `);

            this.logger.logResponse('Project fields', response);

            return response.node.fields.nodes;
        } catch (error) {
            this.logger.logError('Failed to get project fields:');
            throw error;
        }
    }

    async setItemValue(
        projectId: string,
        itemId: string,
        fieldId: string,
        valueOrOptionId: ValueOrOptionId,
    ): Promise<void> {
        this.logger.log(
            `Updating field ${fieldId} for item ${itemId} with value: ${JSON.stringify(valueOrOptionId)}`,
        );

        try {
            const mutation = `
              mutation {
                updateProjectV2ItemFieldValue(
                input: {
                  projectId: "${projectId}"
                  itemId: "${itemId}"
                  fieldId: "${fieldId}"
                  value: ${valueOrOptionId}
                }) {
                  projectV2Item {
                    id
                  }
                }
              }
          `;

            await this.octokit.graphql<UpdateProjectItemFieldResponse>(mutation);
            this.logger.log(`Successfully updated field for item ${itemId}`);
        } catch (error) {
            this.logger.logError(`Failed to update field for item ${itemId}:`);
            throw error;
        }
    }

    async updateFieldOptions(
        fieldId: string,
        options: { value: string; color: string }[],
    ): Promise<void> {
        this.logger.log(`Updating all options for field ${fieldId}`);
        try {
            const optionsString = options
                .map(
                    opt =>
                        `{ name: "${opt.value}", description: "${opt.value}", color: ${opt.color} }`,
                )
                .join(',\n');

            const mutation = `
            mutation {
              updateProjectV2Field(
              input: {
                fieldId: "${fieldId}"
                singleSelectOptions: [
                  ${optionsString}
                ]
              }) {
                projectV2Field {
                  ... on ProjectV2SingleSelectField {
                    id
                  }
                }
              } 
            }
          `;

            await this.octokit.graphql(mutation);
            this.logger.log(`Successfully replaced all options for field ${fieldId}`);
        } catch (error) {
            this.logger.logError(`Failed to update field options.`);
            throw error;
        }
    }
}
