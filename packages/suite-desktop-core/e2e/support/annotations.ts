import { TestDetailsAnnotation } from '@playwright/test';
import { TestCase } from '@playwright/test/reporter';

import {
    TestAnnotationType,
    TestCategory,
    TestPriority,
    TestStatus,
    TestStream,
    annotationsForBodyDescription,
    annotationsForProjectFields,
    testAnnotations,
} from './enums/testAnnotations';

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

export const createTestAnnotation = (metadata: TestMetadataInput): TestDetailsAnnotation[] => {
    const formattedAnnotations = [];

    for (const [key, value] of Object.entries(metadata)) {
        const annotation = testAnnotations.find(a => a.key === key);
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

export class TestReportProvider {
    private readonly test: TestCase;
    private readonly annotationMap: Map<string, string>;
    private readonly defaults = {
        prerequisites: 'No prerequisites defined',
        steps: 'No steps defined',
        category: TestCategory.Uncategorized,
        priority: TestPriority.Medium,
        stream: TestStream.Unassigned,
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
            // TODO: Provide link to trace
            return 'Automated';
        }
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

    getterByKey(key: string): string {
        const validGetterKeys = [
            'testCase',
            'prerequisites',
            'steps',
            'category',
            'priority',
            'stream',
            'status',
            'testRun',
            'comment',
        ] as const;

        type StringGetterKey = (typeof validGetterKeys)[number];

        const isValidKey = (k: string): k is StringGetterKey =>
            validGetterKeys.includes(k as StringGetterKey);

        if (!isValidKey(key)) {
            throw new Error(
                `The key '${key}' does not have corresponding getter on TestReportProvider class.`,
            );
        }

        return this[key];
    }
}
