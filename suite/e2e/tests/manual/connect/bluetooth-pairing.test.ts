import { TestCategory, TestOsMatrix, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Bluetooth pairing', { tag: ['@group=manual'] }, () => {
    test(
        'Pair a Trezor over Bluetooth for the first time',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the first-time Bluetooth pairing of a THP device: scanning, PIN confirmation, and that the paired device can be used for discovery and signing.',
                prerequisites: [
                    'Trezor Suite desktop app',
                    'Seeded Bluetooth-capable Trezor (T3W1) not yet paired with this computer',
                    'Bluetooth enabled on the computer and no Trezor listed in the OS Bluetooth settings',
                ],
                steps: [
                    'Start Trezor Suite with no Trezor connected via cable',
                    'Start the Bluetooth connection flow and confirm the device is found while scanning',
                    'Select the device from the scanning list and start pairing',
                    'Confirm the pairing PIN shown in Suite matches the PIN shown on the Trezor display',
                    'Confirm the pairing on the Trezor',
                    'Confirm Suite reports the device as paired and then connected',
                    'Unlock the device and let discovery finish',
                    'Send a transaction over the Bluetooth connection and confirm it is signed and broadcast',
                    'Confirm the Trezor is now listed in the OS Bluetooth settings',
                ],
                category: TestCategory.Device,
                priority: TestPriority.Critical,
                stream: TestStream.Connect,
                osMatrix: [TestOsMatrix.Windows, TestOsMatrix.MacOSArm],
            }),
        },
        async () => {},
    );

    test(
        'Bluetooth reconnect, auto-connect and adapter states',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies reconnection of an already paired device, the "Auto-connect" device setting, and how Suite behaves when the Bluetooth adapter is unavailable or the device is out of range.',
                prerequisites: [
                    'Trezor Suite desktop app',
                    'Seeded Bluetooth-capable Trezor (T3W1) already paired with this computer',
                ],
                steps: [
                    'Restart Suite and confirm the paired device reconnects without asking for the pairing PIN again',
                    'Navigate to "Settings/Device" and confirm the "Auto-connect" switch is present',
                    'Enable "Auto-connect", restart Suite and confirm the device connects without approving the connection',
                    'Disable "Auto-connect", restart Suite and confirm the connection has to be approved again',
                    'Move the device out of Bluetooth range (or power it off) and confirm Suite reports the device as disconnected without crashing',
                    'Bring the device back in range and confirm it reconnects',
                    'Turn off the Bluetooth adapter on the computer and confirm Suite shows the adapter status and prompts to enable Bluetooth',
                    'Turn the adapter back on and confirm the device can be connected again',
                    'Connect the same device via USB cable while the Bluetooth connection is active and confirm Suite does not present the device twice',
                ],
                category: TestCategory.Device,
                priority: TestPriority.High,
                stream: TestStream.Connect,
                osMatrix: [TestOsMatrix.Windows, TestOsMatrix.MacOSArm],
            }),
        },
        async () => {},
    );
});
