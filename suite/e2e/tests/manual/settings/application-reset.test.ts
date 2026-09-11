import { TestCategory, TestOsMatrix, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Reset application', { tag: ['@group=manual'] }, () => {
    test(
        'Reset application',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that resetting the app erases all local data and restores the original settings.',
                prerequisites: [
                    'Trezor Suite application',
                    'Changed settings to verify against (eg. non-default theme, fiat currency and enabled networks)',
                    'At least one remembered wallet',
                    'Auto start enabled (desktop only)',
                ],
                steps: [
                    'Navigate to Settings/Application',
                    'In the "Reset app to default" section click on "Reset app"',
                    'Suite restarts',
                    'Confirm onboarding is shown again',
                    'Confirm the changed settings are back to their defaults',
                    'Confirm no remembered wallet is listed any more',
                    'Confirm auto start is disabled again (desktop only)',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
                stream: TestStream.Growth,
                osMatrix: [TestOsMatrix.Linux, TestOsMatrix.Windows, TestOsMatrix.MacOSArm],
            }),
        },
        async () => {},
    );
});
