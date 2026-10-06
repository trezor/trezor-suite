import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('PIN and wipe code', { tag: ['@group=manual'] }, () => {
    test(
        'Enable, change and disable PIN protection',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that PIN protection can be enabled, the PIN changed and the protection removed, and that the PIN is enforced after reconnecting the device.',
                prerequisites: ['Seeded Trezor device without a PIN set', 'Connected Trezor Suite'],
                steps: [
                    'Navigate to "Settings/Device"',
                    'In the "PIN" section enable the PIN switch',
                    'Set a PIN and confirm it on the device',
                    'Confirm Suite reports the PIN as enabled',
                    'Reconnect the device and confirm the PIN is requested before the wallet loads',
                    'Enter a wrong PIN and confirm the device reports the failed attempt',
                    'Enter the correct PIN and confirm the wallet loads',
                    'In the "Change PIN" section click "Change" and set a different PIN',
                    'Reconnect the device and confirm only the new PIN is accepted',
                    'Disable the PIN switch and confirm the removal on the device',
                    'Reconnect the device and confirm no PIN is requested',
                ],
                category: TestCategory.Security,
                priority: TestPriority.Critical,
                stream: TestStream.Firmware,
            }),
        },
        async () => {},
    );

    test(
        'Set up a wipe code and verify it erases the device',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a wipe code can be set up and removed, and that entering the wipe code instead of the PIN erases the device.',
                prerequisites: [
                    'Trezor device seeded with a disposable seed',
                    'PIN protection already enabled on the device',
                    'Connected Trezor Suite',
                ],
                steps: [
                    'Navigate to "Settings/Device"',
                    'Find the "Set up wipe code" section and start the setup',
                    'Set a wipe code that differs from the PIN and confirm it on the device',
                    'Confirm Suite offers "Remove" for the wipe code once it is set',
                    'Try to set the wipe code to the same value as the PIN and confirm it is rejected',
                    'Click "Remove" and confirm the wipe code is removed on the device',
                    'Set the wipe code up again',
                    'Reconnect the device and enter the wipe code on the PIN prompt',
                    'Confirm the device is erased and Suite offers to set up a new device',
                    'Confirm no wallet data of the erased device is left in Suite',
                ],
                category: TestCategory.Security,
                priority: TestPriority.High,
                stream: TestStream.Firmware,
            }),
        },
        async () => {},
    );
});
