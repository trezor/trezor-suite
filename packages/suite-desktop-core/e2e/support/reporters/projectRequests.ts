import type { Octokit } from '@octokit/rest';

import {
    CreateFieldResponse,
    CreateProjectMutation,
    LoggingFunctions,
    Project,
    ProjectField,
    ProjectFieldsResponse,
    ProjectQueryResponse,
} from './types';

export async function getProjectFields(
    octokit: Octokit,
    projectId: string,
): Promise<ProjectField[]> {
    const query = `
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
    `;

    const response = await octokit.graphql<ProjectFieldsResponse>(query);

    return response.node.fields.nodes;
}

export class ProjectRequests {
    constructor(
        private readonly octokit: Octokit,
        private readonly logger: LoggingFunctions,
    ) {}

    async createProject(ownerId: string, teamId: string, projectName: string): Promise<string> {
        this.logger.log(`Creating project "${projectName}" with owner ID: ${ownerId}`);

        const mutation = `
            mutation {
                createProjectV2(
                input: {
                    ownerId: "${ownerId}"
                    title: "${projectName}"
                    teamId: "${teamId}"
                }) {
                    projectV2 {
                        id
                    }
                }
            }
        `;

        const response = await this.octokit.graphql<CreateProjectMutation>(mutation);
        const projectId = response.createProjectV2.projectV2.id;

        this.logger.log(`Created GitHub project ${projectName} with ID: ${projectId}`);

        return projectId;
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

        if (isSelectField && options) {
            optionsString = options
                .map(opt => `{ name: "${opt.value}", description: "", color: ${opt.color} }`)
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
    }

    async getProjectFromOrganization(
        organization: string,
        projectName: string,
    ): Promise<Project[]> {
        this.logger.log(`Fetching projects for organization: ${organization}`);

        const query = `
            query {
              organization(login: "${organization}") {
                projectsV2(first: 30, query: "${projectName}", orderBy: {field: NUMBER, direction: ASC}) {
                  nodes {
                    id
                    title
                    number
                  }
                }
              }
            }
        `;

        const response = await this.octokit.graphql<ProjectQueryResponse>(query);
        this.logger.log('Successfully retrieved organization projects');

        return response.organization.projectsV2.nodes;
    }

    async getProjectFields(projectId: string): Promise<ProjectField[]> {
        this.logger.log(`Fetching fields for project ${projectId}...`);
        const response = await getProjectFields(this.octokit, projectId);
        this.logger.log(`Successfully retrieved fields for project ${projectId}`);

        return response;
    }

    async updateFieldOptions(
        fieldId: string,
        options: { value: string; color: string }[],
    ): Promise<void> {
        this.logger.log(`Updating all options for field ${fieldId}`);

        const optionsString = options
            .map(opt => `{ name: "${opt.value}", description: "", color: ${opt.color} }`)
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
    }
}
