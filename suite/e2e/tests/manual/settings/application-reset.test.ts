import { TestCategory, TestOsMatrix, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Reset application', { tag: ['@group=manual'] }, () => {
    test(
        'Reset application',
        {
            annotation: createTestAnnotation({
                testCase: 'Reset application',
                prerequisites: ['Trezor Suite application'],
                steps: [
                    'Navigate to Settings/Application',
                    'Click on Reset app',
                    'Suite should restart with Settings reset',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
                stream: TestStream.Growth,
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
