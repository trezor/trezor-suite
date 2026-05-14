import type { NetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';

test.describe('Device Settings - Forget TS7', { tag: ['@T3W1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test(
        'Confirm forget disconnected TS7 with BT history',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a disconnected TS7 device with Bluetooth history successfully unpairs and is forgotten, skipping the "Unplug" step.',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
            tag: ['@desktopOnly'],
        },
        async ({ page, device, onboardingPage, settingsPage, walletPage }) => {
            await test.step('Disconnect device', async () => {
                await device.powerOff();

                await expect(walletPage.deviceDisconnectedStatus).toBeVisible();
            });

            // Mock device Bluetooth state
            await page.mockDeviceBluetoothState({ isConnected: false });
            await page.expectDeviceState({ connected: false, apiType: 'bluetooth' });

            await test.step('Forget device', async () => {
                await settingsPage.deviceTab.deviceForgetButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_HEADING',
                );
                await settingsPage.deviceTab.verifyForgetDeviceContent([
                    'TR_FORGET_DEVICE_MODAL_BULLET_FORGET',
                    'TR_FORGET_DEVICE_MODAL_BLUETOOTH_REMOVED',
                    'TR_FORGET_DEVICE_MODAL_BULLET_NOT_WIPE',
                ]);
            });

            await test.step('Confirm device forgetting', async () => {
                await settingsPage.deviceTab.deviceForgetConfirmButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_FINISH_HEADING',
                );
            });

            await test.step('Confirm Bluetooth removal', async () => {
                await settingsPage.deviceTab.completeBluetoothForgetFlow();

                await expect(onboardingPage.welcomeBody).toBeVisible();
                await settingsPage.deviceTab.verifyToastDeviceForgotten();
            });
        },
    );

    test(
        'Confirm forget device TS7 connected via USB with BT history',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a USB-connected TS7 device with Bluetooth history is unpaired and forgotten successfully.',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
            tag: ['@desktopOnly'],
        },
        async ({ page, device, onboardingPage, settingsPage }) => {
            // Mock device bluetooth state
            await page.mockDeviceBluetoothState({ isConnected: true, apiType: 'usb' });
            await page.expectDeviceState({ connected: true, apiType: 'usb' });

            await test.step('Forget device', async () => {
                await settingsPage.deviceTab.deviceForgetButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_HEADING',
                );
                await settingsPage.deviceTab.verifyForgetDeviceContent([
                    'TR_FORGET_DEVICE_MODAL_BULLET_FORGET',
                    'TR_FORGET_DEVICE_MODAL_BLUETOOTH_REMOVED',
                    'TR_FORGET_DEVICE_MODAL_BULLET_NOT_WIPE',
                ]);
            });

            await test.step('Confirm device forgetting', async () => {
                await settingsPage.deviceTab.deviceForgetConfirmButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_FINISH_HEADING',
                );
            });

            await test.step('Confirm Bluetooth removal', async () => {
                await settingsPage.deviceTab.completeBluetoothForgetFlow();

                await settingsPage.deviceTab.verifyFinishForgettingDeviceModal();
            });

            await test.step('Complete the process by disconnecting device', async () => {
                await device.powerOff();

                await expect(settingsPage.deviceTab.unplugDeviceModal).toBeHidden();
                await expect(onboardingPage.welcomeBody).toBeVisible();
                await settingsPage.deviceTab.verifyToastDeviceForgotten();
            });
        },
    );

    test(
        'Confirm forget device TS7 connected via USB',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a USB-connected TS7 device has been unpaired and forgotten successfully.',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
        },
        async ({ device, settingsPage }) => {
            await test.step('Forget device', async () => {
                await settingsPage.deviceTab.deviceForgetButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_HEADING',
                );
                await settingsPage.deviceTab.verifyForgetDeviceContent([
                    'TR_FORGET_DEVICE_MODAL_BULLET_FORGET',
                    'TR_FORGET_DEVICE_MODAL_BULLET_NOT_WIPE',
                ]);
            });

            await test.step('Confirm device forgetting', async () => {
                await settingsPage.deviceTab.deviceForgetConfirmButton.click();

                await settingsPage.deviceTab.verifyFinishForgettingDeviceModal();
            });

            await test.step('Complete the process by disconnecting device', async () => {
                await device.powerOff();

                await expect(settingsPage.deviceTab.unplugDeviceModal).toBeHidden();
                await settingsPage.deviceTab.verifyToastDeviceForgotten();
            });
        },
    );

    test(
        'Confirm forget disconnected device TS7',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a disconnected TS7 device has been unpaired and forgotten successfully',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
        },
        async ({ device, settingsPage, walletPage, onboardingPage }) => {
            await test.step('Disconnect device', async () => {
                await device.powerOff();

                await expect(walletPage.deviceDisconnectedStatus).toBeVisible();
            });

            await test.step('Forget device', async () => {
                await settingsPage.deviceTab.deviceForgetButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_HEADING',
                );
                await settingsPage.deviceTab.verifyForgetDeviceContent([
                    'TR_FORGET_DEVICE_MODAL_BULLET_FORGET',
                    'TR_FORGET_DEVICE_MODAL_BULLET_NOT_WIPE',
                ]);
            });

            await test.step('Confirm device forgetting', async () => {
                await settingsPage.deviceTab.deviceForgetConfirmButton.click();

                await expect(onboardingPage.welcomeBody).toBeVisible();
            });
        },
    );

    test(
        'Cancel forget device TS7',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify that the TS7 device "Forget" process was cancelled successfully.',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
        },
        async ({ page, settingsPage }) => {
            await test.step('Forget device', async () => {
                await settingsPage.deviceTab.deviceForgetButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_HEADING',
                );
            });

            await test.step('Cancel the forget device modal', async () => {
                await settingsPage.deviceTab.deviceForgetCancelButton.click();

                await expect(page.modal).toBeHidden();
            });
        },
    );

    test(
        'Forget button is disabled during discovery process',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that the "Forget" button is disabled during the discovery process and enabled once discovery finishes.',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
        },
        async ({ page, settingsPage }) => {
            const coins: NetworkSymbol[] = ['eth', 'ada', 'sol'];

            await test.step('Enable few coins', async () => {
                await settingsPage.navigateTo('coins');

                for (const coin of coins) {
                    await settingsPage.coinsTab.enableNetwork(coin);
                }

                await settingsPage.coinsTab.activateCoinsButton.click();
            });

            await test.step('Verify "Forget" button is disabled', async () => {
                await settingsPage.navigateTo('device');

                await expect(settingsPage.deviceTab.deviceForgetButton).toBeDisabled();
            });

            await test.step('Verify "Forget" button is enabled when discovery finished', async () => {
                await page.discoveryShouldFinish();

                await expect(settingsPage.deviceTab.deviceForgetButton).toBeEnabled();
            });
        },
    );
});

test.describe('Device Settings - Forget TS5', { tag: ['@T3T1', '@smoke'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test(
        'Confirm forget device TS5',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that the TS5 device has been unpaired and forgotten successfully.',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
        },
        async ({ device, settingsPage }) => {
            await test.step('Forget device', async () => {
                await settingsPage.deviceTab.deviceForgetButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_HEADING',
                );
                await settingsPage.deviceTab.verifyForgetDeviceContent([
                    'TR_FORGET_DEVICE_MODAL_BULLET_FORGET',
                    'TR_FORGET_DEVICE_MODAL_BULLET_NOT_WIPE',
                ]);
            });

            await test.step('Confirm device forgetting', async () => {
                await settingsPage.deviceTab.deviceForgetConfirmButton.click();

                await settingsPage.deviceTab.verifyFinishForgettingDeviceModal();
            });

            await test.step('Complete the process by disconnecting device', async () => {
                await device.powerOff();

                await expect(settingsPage.deviceTab.unplugDeviceModal).toBeHidden();
                await settingsPage.deviceTab.verifyToastDeviceForgotten();
            });
        },
    );

    test(
        'Confirm forget disconnected device TS5',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a disconnected TS5 device has been unpaired and forgotten successfully.',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
        },
        async ({ device, settingsPage }) => {
            await test.step('Disconnect device', async () => {
                await device.powerOff();
            });

            await test.step('Forget device', async () => {
                await settingsPage.deviceTab.deviceForgetButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_HEADING',
                );
                await settingsPage.deviceTab.verifyForgetDeviceContent([
                    'TR_FORGET_DEVICE_MODAL_BULLET_FORGET',
                    'TR_FORGET_DEVICE_MODAL_BULLET_NOT_WIPE',
                ]);
            });

            await test.step('Confirm device forgetting', async () => {
                await settingsPage.deviceTab.deviceForgetConfirmButton.click();

                await settingsPage.deviceTab.verifyFinishForgettingDeviceModal();
            });

            await test.step('Complete the process by disconnecting device', async () => {
                await expect(settingsPage.deviceTab.unplugDeviceModal).toBeHidden();
                await settingsPage.deviceTab.verifyToastDeviceForgotten();
            });
        },
    );
});
