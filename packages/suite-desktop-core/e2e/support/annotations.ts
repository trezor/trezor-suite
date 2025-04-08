import {
    TestAnnotationType,
    TestCategory,
    TestPriority,
    TestStream,
} from './enums/testAnnotations';

type TestMetadataInput = {
    testCase?: string;
    prerequisites?: string[];
    steps?: string[];
    category?: TestCategory;
    priority?: TestPriority;
    stream?: TestStream;
};

export const formatTestSteps = (steps: string[]): string =>
    steps.map((step, index) => `${index + 1}. ${step}`).join('\n');

export const createTestAnnotation = (metadata: TestMetadataInput) => {
    const formattedAnnotations = [];

    if (metadata.testCase) {
        formattedAnnotations.push({
            type: TestAnnotationType.TestCase,
            description: metadata.testCase,
        });
    }

    if (metadata.prerequisites) {
        formattedAnnotations.push({
            type: TestAnnotationType.Prerequisites,
            description: formatTestSteps(metadata.prerequisites),
        });
    }

    if (metadata.steps) {
        formattedAnnotations.push({
            type: TestAnnotationType.Steps,
            description: formatTestSteps(metadata.steps),
        });
    }

    if (metadata.category) {
        formattedAnnotations.push({
            type: TestAnnotationType.Category,
            description: metadata.category,
        });
    }

    if (metadata.priority) {
        formattedAnnotations.push({
            type: TestAnnotationType.Priority,
            description: metadata.priority,
        });
    }

    if (metadata.stream) {
        formattedAnnotations.push({
            type: TestAnnotationType.Stream,
            description: metadata.stream,
        });
    }

    return formattedAnnotations;
};
