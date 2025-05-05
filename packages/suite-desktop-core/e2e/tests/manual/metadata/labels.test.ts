import {
    TestCategory,
    TestOsMatrix,
    TestPriority,
    TestStream,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Metadata - labels on non-Linux systems', { tag: ['@group=manual'] }, () => {
    test(
        'Labels on non-Linux systems',
        {
            annotation: createTestAnnotation({
                testCase: 'Labels on non-Linux systems',
                prerequisites: [
                    'Define me please. We have identified this test is automated but only on Linux. Please update this test case in repo',
                ],
                steps: ['Define me please.'],
                category: TestCategory.NotCategorized,
                priority: TestPriority.Medium,
                stream: TestStream.NotDefined,
                osMatrix: [TestOsMatrix.Windows, TestOsMatrix.MacOSArm, TestOsMatrix.MacOSIntel],
            }),
        },
        async () => {},
    );
});
