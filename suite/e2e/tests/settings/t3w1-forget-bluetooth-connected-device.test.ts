import { expect, test } from '../../support/fixtures';

test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

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

            return page.evaluate(() => window.store.getState().device.selectedDevice?.id);
        });

        await test.step('Power off emulator to stop USB events', async () => {
            await device.powerOff();
        });

        await test.step('Inject Bluetooth state', async () => {
            await page.evaluate(
                ({ deviceId: devId }) => {
                    // Set BT adapter as enabled
                    window.store.dispatch({
                        type: '@suite/bluetooth/adapter-event',
                        payload: { status: 'enabled' },
                    });

                    // Add a known BT device linked to the emulator device
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

                    // Set lastConnectedVia to 'bluetooth' in persistent device data
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
            await page.getByTestId('@settings/device/forget-button').scrollIntoViewIfNeeded();
            await page.getByTestId('@settings/device/forget-button').click();
        });

        await test.step('Confirm forget in the confirmation modal', async () => {
            // ThpBtKnownForgetFlow step 1: ConfirmationModal
            await page
                .getByTestId('@settings/device/forget-confirmation-modal')
                .waitFor({ state: 'visible' });
            await page.getByTestId('@settings/device/forget-confirm').click();
        });

        await test.step('Complete OS removal step', async () => {
            // ThpBtKnownForgetFlow step 2: OsAndTrezorCleanupModal
            await page
                .getByTestId('@settings/device/forget-cleanup-modal')
                .waitFor({ state: 'visible' });
            await page.getByTestId('@settings/device/forget-os-removal-confirm').click();
        });

        await test.step('Complete Trezor removal step', async () => {
            await page.getByTestId('@settings/device/forget-trezor-removal-confirm').click();
        });

        await test.step('Verify landing on starting screen', async () => {
            await expect(page.getByTestId('@welcome-layout/body')).toBeVisible({
                timeout: 30_000,
            });
        });

        await test.step('Reload and verify no wallet is remembered', async () => {
            await page.reload();
            await expect(page.getByTestId('@welcome-layout/body')).toBeVisible({
                timeout: 30_000,
            });
        });
    });

    /**
     * Tests the forget flow for a disconnected TS7 with no Bluetooth credentials
     * (thp-disconnected → ImmediateForgetFlow).
     * Confirmation → forget immediately, no unplug or cleanup steps.
     */
    test('User can forget a disconnected TS7 without BT credentials immediately', async ({
        onboardingPage,
        settingsPage,
        page,
        device,
    }) => {
        await onboardingPage.completeOnboarding();

        await test.step('Power off emulator to simulate disconnected device', async () => {
            await device.powerOff();
        });

        await test.step('Navigate to device settings', async () => {
            await settingsPage.navigateTo('device');
        });

        await test.step('Click Forget device button', async () => {
            await page.getByTestId('@settings/device/forget-button').scrollIntoViewIfNeeded();
            await page.getByTestId('@settings/device/forget-button').click();
        });

        await test.step('Confirm forget in the confirmation modal', async () => {
            // ImmediateForgetFlow: ConfirmationModal → forget immediately
            await page
                .getByTestId('@settings/device/forget-confirmation-modal')
                .waitFor({ state: 'visible' });
            await page.getByTestId('@settings/device/forget-confirm').click();
        });

        await test.step('Verify landing on starting screen', async () => {
            await expect(page.getByTestId('@welcome-layout/body')).toBeVisible({
                timeout: 30_000,
            });
        });

        await test.step('Reload and verify no wallet is remembered', async () => {
            await page.reload();
            await expect(page.getByTestId('@welcome-layout/body')).toBeVisible({
                timeout: 30_000,
            });
        });
    });
});
