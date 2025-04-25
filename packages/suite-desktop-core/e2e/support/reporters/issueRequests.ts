import type { Octokit } from '@octokit/rest';

import { getProjectFields } from './projectRequests';
import {
    AddDraftIssueResponse,
    AddIssueToProjectResponse,
    ProjectField,
    UpdateProjectItemFieldResponse,
    ValueOrOptionId,
} from './types';

export class IssueRequests {
    constructor(private readonly octokit: Octokit) {}

    async addIssueToProject(projectId: string, issueNodeId: string): Promise<string> {
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
    }

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

    private escapeGraphQLString(input: string): string {
        return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    async createDraftIssueInProject(
        projectId: string,
        title: string,
        body: string,
    ): Promise<string> {
        const mutation = `
        mutation {
          addProjectV2DraftIssue(
            input: {
              assigneeIds: []
              projectId: "${projectId}"
              title: "${this.escapeGraphQLString(title)}"
              body: "${this.escapeGraphQLString(body)}"
            }
          ) {
            projectItem {
              id
            }
          }
        }
    `;

        const response = await this.octokit.graphql<AddDraftIssueResponse>(mutation);
        const issueId = response.addProjectV2DraftIssue.projectItem.id;

        return issueId;
    }
}
