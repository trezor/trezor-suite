import { createTestAnnotation } from '../../../support/annotations';
import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Custom firmware', { tag: ['@group=manual'] }, () => {
    test(
        'Custom firmware installation',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can install custom firmware on a Trezor device.',
                prerequisites: ['Custom firmware downloaded', 'Trezor device in bootloader mode'],
                steps: [
                    'Navigate to "Settings/Device"',
                    'Click on "Install firmware"',
                    'Install custom firmware modal appears',
                    'Select the custom firmware',
                    'Observe the initialization on the device',
                    'Complete the FW installation on the device',
                ],
                category: TestCategory.Firmware,
                priority: TestPriority.Low,
                stream: TestStream.Firmware,
            }),
        },
        async () => {},
    );
});
