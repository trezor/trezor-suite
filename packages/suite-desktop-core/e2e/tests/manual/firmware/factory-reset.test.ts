import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Factory reset', { tag: ['@group=manual'] }, () => {
    test(
        'Perform full factory reset',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can perform a full factory reset on a Trezor device.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Trezor device',
                        'Connected Trezor Suite',
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Connect Trezor in bootloader mode',
                        'Navigate to "Settings/Device"',
                        'Click on "Factory reset"',
                        'Factory reset modal opens up with 2 tick boxes',
                        'Continue on the device',
                        'Device will reset',
                        'Suite should tell you to reconnect device and no "Unacquired device" should be present',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
