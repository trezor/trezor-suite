import type {
    DeviceModel,
    TestCategory,
    TestOsMatrix,
    TestPriority,
    TestStream,
} from '../enums/testAnnotations';

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

interface Issue {
    id: string;
    title: string;
}

export interface AddDraftIssueResponse {
    addProjectV2DraftIssue: {
        projectItem: {
            id: string;
            content: Issue;
        };
    };
}

export interface ProjectItemFieldValue {
    name?: string;
    text?: string;
    field?: { name: string };
}

export interface ProjectItem {
    id: string;
    content: { title?: string } | null;
    fieldValues: { nodes: ProjectItemFieldValue[] };
}

export interface ProjectItemsResponse {
    node: {
        items: {
            nodes: ProjectItem[];
        };
    };
}

export interface DeleteProjectItemResponse {
    deleteProjectV2Item: {
        deletedItemId: string;
    };
}

export type ValueOrOptionId = string | { optionId: string };

export interface TestDetailsAnnotation {
    type: string;
    description?: string | undefined;
}

// NotDefined is the reporter's fallback for tests that carry no annotation, never an assignment.
export type AssignedTestStream = Exclude<TestStream, TestStream.NotDefined>;

export interface TestMetadataInput {
    testCase?: string;
    prerequisites?: string[];
    steps?: string[];
    category?: TestCategory;
    priority?: TestPriority;
    stream: AssignedTestStream;
    deviceModel?: DeviceModel;
    osMatrix?: TestOsMatrix[];
}
