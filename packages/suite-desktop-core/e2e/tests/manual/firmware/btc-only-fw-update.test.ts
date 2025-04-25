import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('BTC only firmware', { tag: ['@group=manual'] }, () => {
    test(
        'BTC only firmware update',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can update the firmware on a Trezor device with BTC only firmware.',
                prerequisites: ['BTC only firmware on Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'Navigate to "Settings/Device"',
                    'Click on "Update available" button',
                    'Install Firmware modal is displayed',
                    'Click on "Install firmware"',
                    'Check the box and click on "Continue"',
                    'Follow instructions on device and proceed with the firmware update',
                ],
                category: TestCategory.Firmware,
                priority: TestPriority.High,
                stream: TestStream.Firmware,
            }),
        },
        async () => {},
    );
});
