import {
    TestCategory,
    TestOsMatrix,
    TestPriority,
    TestStream,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Firmware update', { tag: ['@group=manual'] }, () => {
    test(
        'Perform firmware update',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can update the firmware on a Trezor device.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed"',
                    'Connected Trezor Suite',
                    'Previous version of firmware - i.e. not 2.8.9 to 2.8.9 update',
                ],
                steps: [
                    'Navigate to "Settings"/"Device"',
                    'Click on "Update available" button',
                    'Install Firmware modal is displayed',
                    'Click on "Install firmware"',
                    'Check the box and click on "Continue"',
                    'Follow instructions on device and proceed with the firmware update',
                    'Go to "Accounts" or to "Dashboard" and see if the discovery finishes',
                ],
                category: TestCategory.Firmware,
                priority: TestPriority.High,
                stream: TestStream.Firmware,
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
