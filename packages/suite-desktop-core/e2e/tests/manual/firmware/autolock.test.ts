import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Autolock', { tag: ['@group=manual'] }, () => {
    test(
        'Autolock settings',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can change the autolock time on the device.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite'],
                steps: [
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
                ],
                category: TestCategory.Firmware,
                priority: TestPriority.Low,
                stream: TestStream.Firmware,
            }),
        },
        async () => {},
    );
});
