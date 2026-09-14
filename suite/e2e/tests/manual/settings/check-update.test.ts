import { TestCategory, TestOsMatrix, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Check for update', { tag: ['@group=manual'] }, () => {
    test(
        'Check for updates modal',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can check for updates in the Trezor Suite.',
                prerequisites: [
                    'Trezor Suite desktop app - the update section is not rendered on web',
                    'Automatic updates not disabled by the build',
                ],
                steps: [
                    'Go to "Settings/Application"',
                    'Find the "Trezor Suite version" section and confirm the current version is shown',
                    'Click on "Check for updates"',
                    'The button switches to the "Checking for updates" state',
                    'When no update is available, confirm the button returns to "Check for updates"',
                    'When an update is available, confirm the button changes to "Update available" and opens the update modal',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.High,
                stream: TestStream.Growth,
                osMatrix: [TestOsMatrix.Linux, TestOsMatrix.Windows, TestOsMatrix.MacOSArm],
            }),
        },
        async () => {},
    );
});
