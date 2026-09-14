import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Factory reset', { tag: ['@group=manual'] }, () => {
    test(
        'Perform full factory reset',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can perform a full factory reset on a Trezor device.',
                prerequisites: ['Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'Connect Trezor in bootloader mode',
                    'Navigate to "Settings/Device"',
                    'Click on "Factory reset" (the section is labelled "Wipe device" outside of bootloader mode)',
                    'Factory reset modal opens up with two step cards - "Erase all data" and "Wallet backup"',
                    'Confirm the first step card with "I understand" and check the second card becomes active',
                    'Confirm the second step card with "I understand"',
                    'Continue on the device',
                    'Device will reset and a success modal is shown in Suite',
                    'Suite should tell you to reconnect device and no "Unacquired device" should be present',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.Critical,
                stream: TestStream.Firmware,
            }),
        },
        async () => {},
    );
});
