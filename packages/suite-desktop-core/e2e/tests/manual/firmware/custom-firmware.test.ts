import { TestAnnotationType, TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Custom firmware', { tag: ['@group=manual'] }, () => {
    test(
        'Custom firmware installation',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can install custom firmware on a Trezor device.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Custom firmware downloaded',
                        'Trezor device in bootloader mode',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'Click on "Install firmware"',
                        'Install custom firmware modal appears',
                        'Select the custom firmware',
                        'Observe the initialization on the device',
                        'Complete the FW installation on the device',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Firmware,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Low,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: TestStream.Firmware,
                },
            ],
        },
        async () => {},
    );
});
