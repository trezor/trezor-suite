import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('BTC only firmware', { tag: ['@group=manual'] }, () => {
    test(
        'BTC only firmware update',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can update the firmware on a Trezor device with BTC only firmware.',
                },
                {
                    type: TestAnnotation.Prerequisites,
                    description: formatTestSteps([
                        'BTC only firmware on Trezor device',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'Click on "Update available" button',
                        'Install Firmware modal is displayed',
                        'Click on "Install firmware"',
                        'Check the box and click on "Continue"',
                        'Follow instructions on device and proceed with the firmware update',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
