import {
    TestCategory,
    TestOsMatrix,
    TestPriority,
    TestStream,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Application reset', { tag: ['@group=manual'] }, () => {
    test(
        'Application reset',
        {
            annotation: createTestAnnotation({
                testCase: 'TBD',
                prerequisites: ['TBD'],
                steps: ['TBD'],
                category: TestCategory.NotCategorized,
                priority: TestPriority.Medium,
                stream: TestStream.NotDefined,
                osMatrix: [
                    TestOsMatrix.Linux,
                    TestOsMatrix.Windows,
                    TestOsMatrix.MacOSArm,
                    TestOsMatrix.MacOSIntel,
                ],
            }),
        },
        async () => {},
    );
});
