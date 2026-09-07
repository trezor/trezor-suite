import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Forget device', { tag: ['@group=manual'] }, () => {
    test(
        'Forget a device connected via cable',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the forget flow for a device without Bluetooth history: confirmation, the prompt to unplug, and that the device is forgotten only after it is disconnected.',
                prerequisites: [
                    'Seeded Trezor without Bluetooth pairing history (eg. T3T1 or T2T1)',
                    'Connected Trezor Suite with the device connected via cable',
                ],
                steps: [
                    'Navigate to "Settings/Device"',
                    'In the "Forget device" section click "Forget"',
                    'Confirm the modal states that Suite will forget the Trezor and that the device will not be wiped',
                    'Confirm the modal',
                    'Confirm Suite prompts to unplug the device',
                    'Confirm the device is still listed while it stays plugged in',
                    'Unplug the device',
                    'Confirm a "device forgotten" toast is shown and Suite navigates to the dashboard',
                    'Confirm the device and its wallets are no longer listed in the device selector',
                    'Reconnect the device and confirm it is treated as a newly connected device',
                ],
                category: TestCategory.Device,
                priority: TestPriority.High,
                stream: TestStream.Growth,
            }),
        },
        async () => {},
    );

    test(
        'Forget a disconnected device',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a disconnected device without Bluetooth history is forgotten immediately after the confirmation, with no unplug prompt.',
                prerequisites: [
                    'Trezor Suite with a previously loaded wallet of a device that is now disconnected',
                    'The device has no Bluetooth pairing history',
                ],
                steps: [
                    'Select the wallet of the disconnected device',
                    'Navigate to "Settings/Device"',
                    'In the "Forget device" section click "Forget"',
                    'Confirm the modal',
                    'Confirm the device is forgotten immediately without any prompt to unplug',
                    'Confirm Suite navigates to the dashboard and the device is no longer listed',
                ],
                category: TestCategory.Device,
                priority: TestPriority.Medium,
                stream: TestStream.Growth,
            }),
        },
        async () => {},
    );

    test(
        'Forget a Bluetooth device connected over Bluetooth',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the forget flow for a THP device connected over Bluetooth: unpairing on the device followed by the prompt to remove it from the OS Bluetooth settings.',
                prerequisites: [
                    'Trezor Suite desktop app',
                    'Seeded Bluetooth-capable Trezor (T3W1) paired and currently connected over Bluetooth',
                ],
                steps: [
                    'Navigate to "Settings/Device"',
                    'In the "Forget device" section click "Forget"',
                    'Confirm the modal mentions that the Bluetooth pairing will be removed and the device disconnected',
                    'Confirm the modal',
                    'Confirm the device unpairs and Suite shows the "Remove from Bluetooth settings" modal',
                    'Use "Open Bluetooth settings", remove the Trezor in the OS settings and confirm with "Got it"',
                    'Confirm the device is forgotten and Suite navigates to the dashboard',
                    'Confirm the Trezor is no longer listed in the OS Bluetooth settings',
                    'Start the Bluetooth connection flow again and confirm the device has to be paired from scratch, including the pairing PIN',
                ],
                category: TestCategory.Device,
                priority: TestPriority.High,
                stream: TestStream.Growth,
            }),
        },
        async () => {},
    );

    test(
        'Forget a Bluetooth device connected via cable',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the forget flow for a THP device with Bluetooth credentials that is connected via cable: the OS and Trezor cleanup steps followed by the prompt to unplug.',
                prerequisites: [
                    'Trezor Suite desktop app',
                    'Seeded Bluetooth-capable Trezor (T3W1) with Bluetooth pairing history, currently connected via cable',
                ],
                steps: [
                    'Navigate to "Settings/Device"',
                    'In the "Forget device" section click "Forget"',
                    'Confirm the modal',
                    'Confirm the cleanup modal shows both an "on your computer" and an "on your Trezor" step',
                    'Remove the Trezor from the OS Bluetooth settings and confirm that step with "I\'ve removed it"',
                    'Remove the pairing on the Trezor and confirm that step with "I\'ve removed it"',
                    'Confirm Suite prompts to unplug the device',
                    'Unplug the device and confirm a "device forgotten" toast is shown',
                    'Confirm the device is no longer listed and has to be paired from scratch on the next Bluetooth connection',
                ],
                category: TestCategory.Device,
                priority: TestPriority.Medium,
                stream: TestStream.Growth,
            }),
        },
        async () => {},
    );

    test(
        'Forget a known Bluetooth device that is not connected',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the forget flow for a THP device that is disconnected but still holds Bluetooth credentials: the OS and Trezor cleanup steps with no unplug prompt.',
                prerequisites: [
                    'Trezor Suite desktop app',
                    'Bluetooth-capable Trezor (T3W1) with Bluetooth pairing history, currently disconnected',
                ],
                steps: [
                    'Select the wallet of the disconnected Bluetooth device',
                    'Navigate to "Settings/Device"',
                    'In the "Forget device" section click "Forget"',
                    'Confirm the modal',
                    'Confirm the cleanup modal shows both cleanup steps and confirm each of them',
                    'Confirm no prompt to unplug is shown',
                    'Confirm the device is forgotten and Suite navigates to the dashboard',
                ],
                category: TestCategory.Device,
                priority: TestPriority.Medium,
                stream: TestStream.Growth,
            }),
        },
        async () => {},
    );
});
