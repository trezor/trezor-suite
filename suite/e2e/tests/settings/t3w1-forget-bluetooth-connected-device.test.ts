import { expect, test } from '../../support/fixtures';

test.describe('Forget TS7', { tag: ['@T3W1', '@desktopOnly'] }, () => {
    /**
     * Tests the forget flow for a TS7 that was previously connected via Bluetooth
     * but is currently offline (thp-bt-known flow).
     *
     * We cannot simulate a live BT connection because the emulator continuously
     * sends USB device events that overwrite any descriptor patches. Instead we:
     * 1. Complete onboarding with the emulator
     * 2. Power off the emulator so no events overwrite our state
     * 3. Inject BT state (known device + persistent data)
     * 4. Walk through the thp-bt-known flow: Confirmation → OS cleanup → Trezor cleanup → forget
     * 5. Verify the device is fully forgotten after reload
     */
    test('User can forget a TS7 with BT credentials and no wallet is remembered', async ({
        onboardingPage,
        settingsPage,
        page,
        device,
    }) => {
        await onboardingPage.completeOnboarding();

        const deviceId: string = await test.step('Get device ID from Redux', async () => {
            await page.ensureStoreOnDesktop();

            return page.getReduxObject('device.selectedDevice.id');
        });

        await test.step('Power off emulator to stop USB events', async () => {
            await device.powerOff();
        });

        await test.step('Inject Bluetooth state', async () => {
            await page.evaluate(
                ({ deviceId: devId }) => {
                    window.store.dispatch({
                        type: '@suite/bluetooth/adapter-event',
                        payload: { status: 'enabled' },
                    });

                    window.store.dispatch({
                        type: '@suite/bluetooth/known-devices-update',
                        payload: {
                            knownDevices: [
                                {
                                    id: 'fake-bt-device-001',
                                    name: 'Trezor Safe 7',
                                    manufacturerData: {
                                        deviceModel: 'T3W1',
                                        deviceColor: 0,
                                    },
                                    lastUpdatedTimestamp: Date.now(),
                                    connectionStatus: { type: 'disconnected' },
                                    deviceId: devId,
                                },
                            ],
                        },
                    });

                    const entry = window.store
                        .getState()
                        .device.persistentDeviceData?.find(
                            (d: { device_id: string }) => d.device_id === devId,
                        );
                    if (entry) {
                        entry.lastConnectedVia = 'bluetooth';
                    }
                },
                { deviceId },
            );
        });

        await test.step('Navigate to device settings', async () => {
            await settingsPage.navigateTo('device');
        });

        await test.step('Click Forget device button', async () => {
            await settingsPage.deviceTab.forgetDeviceButton.scrollIntoViewIfNeeded();
            await settingsPage.deviceTab.forgetDeviceButton.click();
        });

        await test.step('Confirm forget in the confirmation modal', async () => {
            await expect(settingsPage.deviceTab.forgetConfirmationModal).toBeVisible();
            await settingsPage.deviceTab.forgetConfirmButton.click();
        });

        await test.step('Complete OS removal step', async () => {
            await expect(settingsPage.deviceTab.forgetCleanupModal).toBeVisible();
            await settingsPage.deviceTab.forgetOsRemovalConfirmButton.click();
        });

        await test.step('Complete Trezor removal step', async () => {
            await settingsPage.deviceTab.forgetTrezorRemovalConfirmButton.click();
        });

        await test.step('Verify landing on starting screen', async () => {
            await expect(onboardingPage.welcomeBody).toBeVisible({
                timeout: 30_000,
            });
        });

        await test.step('Reload and verify no wallet is remembered', async () => {
            await page.reload();
            await expect(onboardingPage.welcomeBody).toBeVisible({
                timeout: 30_000,
            });
        });
    });

    /**
     * Tests the forget flow for a TS7 without Bluetooth credentials,
     * connected via cable. After confirmation, the unplug modal appears
     * and the device is disconnected to complete the forget.
     */
    test('User can forget a cable-connected TS7 without BT credentials after unplugging', async ({
        onboardingPage,
        settingsPage,
        page,
        device,
    }) => {
        await onboardingPage.completeOnboarding();

        await test.step('Navigate to device settings', async () => {
            await settingsPage.navigateTo('device');
        });

        await test.step('Click Forget device button', async () => {
            await settingsPage.deviceTab.forgetDeviceButton.scrollIntoViewIfNeeded();
            await settingsPage.deviceTab.forgetDeviceButton.click();
        });

        await test.step('Confirm forget in the confirmation modal', async () => {
            await expect(settingsPage.deviceTab.forgetConfirmationModal).toBeVisible();
            await settingsPage.deviceTab.forgetConfirmButton.click();
        });

        await test.step('Wait for unplug modal and disconnect device', async () => {
            await expect(settingsPage.deviceTab.forgetUnplugModal).toBeVisible();
            await device.powerOff();
        });

        await test.step('Verify landing on starting screen', async () => {
            await expect(onboardingPage.welcomeBody).toBeVisible({
                timeout: 30_000,
            });
        });

        await test.step('Reload and verify no wallet is remembered', async () => {
            await page.reload();
            await expect(onboardingPage.welcomeBody).toBeVisible({
                timeout: 30_000,
            });
        });
    });

    /**
     * Tests the forget flow for an already disconnected TS7 without BT credentials
     * (thp-disconnected → ImmediateForgetFlow).
     * No unplug modal should appear — forget happens immediately after confirmation.
     */
    test('User can forget an already disconnected TS7 immediately without unplug modal', async ({
        onboardingPage,
        settingsPage,
        page,
        device,
    }) => {
        await onboardingPage.completeOnboarding();

        await test.step('Disconnect device and wait for it to be recognized', async () => {
            await device.powerOff();
            // T3W1 may either set connected=false or remove selectedDevice entirely on disconnect
            await expect(async () => {
                const connected = await page.getReduxObject('device.selectedDevice.connected');
                expect(connected === false || connected === undefined).toBe(true);
            }).toPass({ timeout: 15_000 });
        });

        await test.step('Navigate to device settings', async () => {
            await settingsPage.navigateTo('device');
        });

        await test.step('Click Forget device button', async () => {
            await settingsPage.deviceTab.forgetDeviceButton.scrollIntoViewIfNeeded();
            await settingsPage.deviceTab.forgetDeviceButton.click();
        });

        await test.step('Confirm forget — no unplug modal should appear', async () => {
            await expect(settingsPage.deviceTab.forgetConfirmationModal).toBeVisible();
            await settingsPage.deviceTab.forgetConfirmButton.click();
            await expect(settingsPage.deviceTab.forgetUnplugModal).toBeHidden();
        });

        await test.step('Verify landing on starting screen', async () => {
            await expect(onboardingPage.welcomeBody).toBeVisible({
                timeout: 30_000,
            });
        });

        await test.step('Reload and verify no wallet is remembered', async () => {
            await page.reload();
            await expect(onboardingPage.welcomeBody).toBeVisible({
                timeout: 30_000,
            });
        });
    });
});
