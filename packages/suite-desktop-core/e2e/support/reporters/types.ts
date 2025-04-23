export interface LoggingFunctions {
    log: (...args: any[]) => void;
    logError: (...args: any[]) => void;
    logResponse: (label: string, response: any) => void;
}

export interface Project {
    id: string;
    title: string;
    number: number;
}

// GraphQL Response Types
export interface CreateProjectMutation {
    createProjectV2: {
        projectV2: {
            id: string;
        };
    };
}

export interface ProjectQueryResponse {
    organization: {
        projectsV2: {
            nodes: Project[];
        };
    };
}

export interface AddIssueToProjectResponse {
    addProjectV2ItemById: {
        item: {
            id: string;
        };
    };
}

export interface FieldOption {
    id: string;
    name: string;
}

export interface ProjectField {
    id: string;
    name: string;
    dataType?: string;
    options?: Array<FieldOption>;
}

export interface ProjectFieldsResponse {
    node: {
        fields: {
            nodes: ProjectField[];
        };
    };
}

export interface UpdateProjectItemFieldResponse {
    updateProjectV2ItemFieldValue: {
        projectV2Item: {
            id: string;
        };
    };
}

export interface CreateFieldResponse {
    createProjectV2Field: {
        projectV2Field: {
            id: string;
        };
    };
}

export interface AddDraftIssueResponse {
    addProjectV2DraftIssue: {
        projectItem: {
            id: string;
            content: {
                id: string;
                title: string;
            };
        };
    };
}

export type ValueOrOptionId = string | { optionId: string };
