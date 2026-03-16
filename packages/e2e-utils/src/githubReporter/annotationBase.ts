import { type TestDetailsAnnotation, type TestMetadataInput } from './types';
import {
    DeviceModel,
    TestAnnotationType,
    TestCategory,
    TestOsMatrix,
    TestPriority,
    TestStream,
    annotationsAddedToTest,
    annotationsForBodyDescription,
    annotationsForProjectFields,
} from '../enums/testAnnotations';

const ARRAY_DELIMITER = ', ';

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
            const description = Array.isArray(value) ? value.join(ARRAY_DELIMITER) : value;
            formattedAnnotations.push({ type, description });
        }
    }

    return formattedAnnotations;
};

// Abstract base class providing shared annotation logic with default implementations
export abstract class TestReportProviderBase {
    protected readonly annotationMap: Map<string, string>;
    protected readonly defaults = {
        prerequisites: 'No prerequisites defined',
        steps: 'No steps defined',
        category: TestCategory.NotCategorized,
        priority: TestPriority.Medium,
        stream: TestStream.NotDefined,
        osMatrix: TestOsMatrix.NotDefined,
        deviceModel: DeviceModel.Unknown,
    };

    constructor() {
        this.annotationMap = new Map();
    }

    // Abstract methods that must be implemented by platform-specific classes
    abstract get testTitle(): string;
    abstract get testProject(): string;
    abstract get isManual(): boolean;
    abstract get isRetryAttempt(): boolean;
    abstract get status(): string;
    abstract get id(): string;
    abstract get filePath(): string;

    // Default implementations of shared logic that can be overridden if needed
    protected getAnnotation(type: string, defaultValue: string): string {
        return this.annotationMap.has(type) ? this.annotationMap.get(type)! : defaultValue;
    }

    get testCase(): string {
        return this.getAnnotation(TestAnnotationType.TestCase, this.testTitle);
    }

    get releaseBuild(): string {
        if (!process.env.RELEASE_BUILD) {
            throw new Error('RELEASE_BUILD is not set');
        }

        return process.env.RELEASE_BUILD;
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
            // Capitalize first letter of testProject
            const project = this.testProject;

            return project.charAt(0).toUpperCase() + project.slice(1);
        }
    }

    get osMatrix(): string[] {
        if (this.isManual) {
            const osAnnotation = this.getAnnotation(
                TestAnnotationType.OsMatrix,
                this.defaults.osMatrix,
            );

            return osAnnotation.split(ARRAY_DELIMITER);
        }

        return [TestOsMatrix.Linux];
    }

    get deviceModel(): string {
        return this.getAnnotation(TestAnnotationType.DeviceModel, this.defaults.deviceModel);
    }

    get comment(): string {
        return '';
    }

    get useOsEmoticons(): boolean {
        return this.isManual && this.osMatrix.length > 1;
    }

    get bodyDescription(): string {
        const sections = [];

        if (this.isManual) {
            for (const annotation of annotationsForBodyDescription) {
                const value = this.getterByKey(annotation.key);
                sections.push(`## ${annotation.name}\n${value}`);
            }
        } else {
            sections.push(`## Automated Test\nID: ${this.id}`);
        }

        return sections.join('\n---\n');
    }

    get projectValues(): Array<{ name: string; value: string }> {
        return annotationsForProjectFields.map(field => ({
            name: field.name,
            value: this.getterByKey(field.key),
        }));
    }

    get filename(): string {
        return this.filePath.split('/').pop() || 'unknown-file-name';
    }

    // This method allows us to loop through array of keys and get the value from the getter
    // That way `bodyDescription` and `projectValues` can be generated dynamically
    // and rely on annotations objects (ex: 'annotationsForBodyDescription') as single source definitions
    getterByKey(key: string): string {
        // This is the downside, we need to record all our annotation getters here
        const getters: Record<string, () => string> = {
            testCase: () => this.testCase,
            releaseBuild: () => this.releaseBuild,
            prerequisites: () => this.prerequisites,
            steps: () => this.steps,
            category: () => this.category,
            priority: () => this.priority,
            stream: () => this.stream,
            status: () => this.status,
            testRun: () => this.testRun,
            osMatrix: () => this.osMatrix.join(ARRAY_DELIMITER),
            deviceModel: () => this.deviceModel,
            comment: () => this.comment,
        };

        const getter = getters[key];
        if (!getter) {
            throw new Error(
                `The key '${key}' does not have corresponding getter on TestReportProviderBase class.`,
            );
        }

        return getter();
    }
}
