import { TestAnnotationType, TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('BTC only firmware', { tag: ['@group=manual'] }, () => {
    test(
        'BTC only firmware update',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can update the firmware on a Trezor device with BTC only firmware.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'BTC only firmware on Trezor device',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'Click on "Update available" button',
                        'Install Firmware modal is displayed',
                        'Click on "Install firmware"',
                        'Check the box and click on "Continue"',
                        'Follow instructions on device and proceed with the firmware update',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Firmware,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.High,
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
