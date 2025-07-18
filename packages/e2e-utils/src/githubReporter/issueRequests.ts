import type { Octokit } from '@octokit/rest';

import { getProjectFields } from './projectRequests';
import {
    AddDraftIssueResponse,
    ProjectField,
    UpdateProjectItemFieldResponse,
    ValueOrOptionId,
} from './types';

export class IssueRequests {
    constructor(private readonly octokit: Octokit) {}

    getProjectFields(projectId: string): Promise<ProjectField[]> {
        return getProjectFields(this.octokit, projectId);
    }

    async setItemValue(
        projectId: string,
        itemId: string,
        fieldId: string,
        valueOrOptionId: ValueOrOptionId,
    ): Promise<void> {
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
    }

    async createDraftIssueInProject(
        projectId: string,
        title: string,
        body: string,
    ): Promise<string> {
        const mutation = `
      mutation($projectId: ID!, $title: String!, $body: String!) {
        addProjectV2DraftIssue(
          input: {
            assigneeIds: []
            projectId: $projectId
            title: $title
            body: $body
          }
        ) {
          projectItem {
            id
          }
        }
      }
      `;

        const variables = {
            projectId,
            title,
            body,
        };

        const response = await this.octokit.graphql<AddDraftIssueResponse>(mutation, variables);
        const issueId = response.addProjectV2DraftIssue.projectItem.id;

        return issueId;
    }

    async setMultipleValues(
        projectId: string,
        itemId: string,
        resolvedFieldsAndValues: { fieldId: string; valueOrOptionId: ValueOrOptionId }[],
    ): Promise<void> {
        // Start building the mutation
        let mutation = `
        mutation UpdateMultipleFields($projectId: ID!, $itemId: ID!) {
      `;

        // Add each field update as an aliased operation
        resolvedFieldsAndValues.forEach(({ fieldId, valueOrOptionId }, index) => {
            mutation += `
          update${index}: updateProjectV2ItemFieldValue(
            input: {
              projectId: $projectId
              itemId: $itemId
              fieldId: "${fieldId}"
              value: ${valueOrOptionId}
            }
          ) {
            projectV2Item {
              id
            }
          }
        `;
        });

        // Close the mutation
        mutation += `}`;

        // Execute the combined mutation
        await this.octokit.graphql(mutation, { projectId, itemId });
    }
}
