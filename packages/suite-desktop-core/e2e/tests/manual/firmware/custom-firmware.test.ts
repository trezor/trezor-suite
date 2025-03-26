import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Custom firmware', { tag: ['@group=manual'] }, () => {
    test(
        'Custom firmware installation',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can install custom firmware on a Trezor device.',
                },
                {
                    type: TestAnnotation.Prerequisites,
                    description: formatTestSteps([
                        'Custom firmware downloaded',
                        'Trezor device in bootloader mode',
                    ]),
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'Click on "Install firmware"',
                        'Install custom firmware modal appears',
                        'Select the custom firmware',
                        'Observe the initialization on the device',
                        'Complete the FW installation on the device',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
