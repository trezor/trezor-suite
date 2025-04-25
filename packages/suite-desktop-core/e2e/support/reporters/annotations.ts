import { TestDetailsAnnotation } from '@playwright/test';
import { TestCase } from '@playwright/test/reporter';

import { capitalizeFirstLetter } from '@trezor/utils';

import {
    DeviceModel,
    TestAnnotationType,
    TestCategory,
    TestPriority,
    TestStatus,
    TestStream,
    annotationsAddedToTest,
    annotationsForBodyDescription,
    annotationsForProjectFields,
} from '../enums/testAnnotations';

type TestMetadataInput = {
    testCase?: string;
    prerequisites?: string[];
    steps?: string[];
    category?: TestCategory;
    priority?: TestPriority;
    stream?: TestStream;
};

const formatList = (steps: string[]): string =>
    steps.map((step, index) => `${index + 1}. ${step}`).join('\n');

// Loops thru params and adds these metadata to the test as annotation, used in test files
export const createTestAnnotation = (metadata: TestMetadataInput): TestDetailsAnnotation[] => {
    const formattedAnnotations = [];

    for (const [key, value] of Object.entries(metadata)) {
        const annotation = annotationsAddedToTest.find(a => a.key === key);
        if (!value || !annotation?.annotationType) {
            continue;
        }

        const type = annotation.annotationType.toString();
        if (annotation.needsFormatting) {
            formattedAnnotations.push({ type, description: formatList(value as string[]) });
        } else {
            formattedAnnotations.push({ type, description: value as string });
        }
    }

    return formattedAnnotations;
};

// Class used by our GitHub Reporter to extract metadata from the test and its run
export class TestReportProvider {
    private readonly test: TestCase;
    private readonly annotationMap: Map<string, string>;
    private readonly defaults = {
        prerequisites: 'No prerequisites defined',
        steps: 'No steps defined',
        category: TestCategory.NotCategorized,
        priority: TestPriority.Medium,
        stream: TestStream.NotDefined,
        deviceModel: DeviceModel.Unknown,
    };

    constructor(test: TestCase) {
        this.test = test;
        this.annotationMap = new Map();

        for (const annotation of test.annotations) {
            if (!annotation.description) {
                continue;
            }
            this.annotationMap.set(annotation.type, annotation.description);
        }
    }

    private getAnnotation(type: string, defaultValue: string): string {
        return this.annotationMap.has(type) ? this.annotationMap.get(type)! : defaultValue;
    }

    get testCase(): string {
        return this.getAnnotation(TestAnnotationType.TestCase, this.test.title);
    }
    get status(): string {
        // This condition covers manual and automated tests that are skipped
        if (this.test.outcome() === 'skipped') {
            return TestStatus.Todo;
        }

        if (this.test.ok()) {
            return TestStatus.AutoPass;
        }

        if (!this.test.ok()) {
            return TestStatus.AutoFail;
        }

        return TestStatus.Todo;
    }

    get prerequisites(): string {
        return this.getAnnotation(TestAnnotationType.Prerequisites, this.defaults.prerequisites);
    }

    get steps(): string {
        return this.getAnnotation(TestAnnotationType.Steps, this.defaults.steps);
    }

    get category(): string {
        return this.getAnnotation(TestAnnotationType.Category, this.defaults.category);
    }

    get priority(): string {
        return this.getAnnotation(TestAnnotationType.Priority, this.defaults.priority);
    }

    get stream(): string {
        return this.getAnnotation(TestAnnotationType.Stream, this.defaults.stream);
    }

    get testRun(): string {
        if (this.isManual) {
            return 'Manual';
        } else {
            // Web or Desktop
            const projectType = this.test.parent.project()?.name;

            return capitalizeFirstLetter(projectType ?? 'Automated');
        }
    }

    get deviceModel(): string {
        return this.getAnnotation(TestAnnotationType.DeviceModel, this.defaults.deviceModel);
    }

    get comment(): string {
        return '';
    }

    get rawAnnotations(): Array<{ type: string; description?: string }> {
        return this.test.annotations;
    }

    get isManual(): boolean {
        return this.test.tags.some(tag => tag.startsWith('@group=manual'));
    }

    get bodyDescription(): string {
        const sections = [];

        if (this.isManual) {
            for (const annotation of annotationsForBodyDescription) {
                const value = this.getterByKey(annotation.key);
                sections.push(`## ${annotation.name}\n${value}`);
            }
        } else {
            sections.push('## Automated Test');
        }

        return sections.join('\n---\n');
    }

    get projectValues(): Array<{ name: string; value: string }> {
        return annotationsForProjectFields.map(field => ({
            name: field.name,
            value: this.getterByKey(field.key),
        }));
    }

    // This method allow us to loop thru array of keys and get the value from the getter
    // That way `bodyDescription` and `projectValues` can be generated dynamically
    // and rely on annotations objects (ex: 'annotationsForBodyDescription') as single source definitions
    getterByKey(key: string): string {
        // This is the downside, we need to record of all our annotation getters here
        const getters: Record<string, () => string> = {
            testCase: () => this.testCase,
            prerequisites: () => this.prerequisites,
            steps: () => this.steps,
            category: () => this.category,
            priority: () => this.priority,
            stream: () => this.stream,
            status: () => this.status,
            testRun: () => this.testRun,
            deviceModel: () => this.deviceModel,
            comment: () => this.comment,
        };

        const getter = getters[key];
        if (!getter) {
            throw new Error(
                `The key '${key}' does not have corresponding getter on TestReportProvider class.`,
            );
        }

        return getter();
    }
}
