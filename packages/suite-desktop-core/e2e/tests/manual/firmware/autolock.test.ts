import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Autolock', { tag: ['@group=manual'] }, () => {
    test(
        'Autolock settings',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description: 'Verifies that a user can change the autolock time on the device.',
                },
                {
                    type: TestAnnotation.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'Find "Auto-lock time" in CUSTOMIZATION section',
                        'Already previously set or default value is displayed',
                        'Change value to "1 minute"',
                        'Confirm on Trezor',
                        'Settings changed successfully notification is displayed',
                        'Value changed to 1 minute',
                        'Wait till device autolocks',
                        'Change time value back to previous state',
                        'Unlock dialogue is displayed',
                        'Unlock and confirm via Trezor',
                        'Settings changed successfully notification is displayed',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
