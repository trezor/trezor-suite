import { expect, test } from '../../support/fixtures';

test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

test.describe('Forget TS7 with Bluetooth credentials', { tag: ['@T3W1', '@desktopOnly'] }, () => {
    /**
     * Tests the forget flow for a TS7 connected via cable that also has
     * Bluetooth credentials (thp-cable-connected flow).
     *
     * Since the emulator cannot simulate a real Bluetooth connection, we:
     * 1. Complete onboarding with the emulator (USB-connected TS7)
     * 2. Inject BT state (known device + persistent data) to simulate BT history
     * 3. Walk through the forget flow: Confirmation → OS cleanup → Trezor cleanup → Unplug → forget
     * 4. Verify the device is fully forgotten after reload
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

        await test.step('Inject Bluetooth state to simulate known BT device', async () => {
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
            // ThpCableConnectedForgetFlow step 1: ConfirmationModal
            await page.modal.waitFor({ state: 'visible' });
            await page.getByTestId('@settings/device/forget-confirm').click();
        });

        await test.step('Complete OS removal step', async () => {
            // ThpCableConnectedForgetFlow step 2: OsAndTrezorCleanupModal
            await page.modal.waitFor({ state: 'visible' });
            await page.getByTestId('@settings/device/forget-os-removal-confirm').click();
        });

        await test.step('Complete Trezor removal step', async () => {
            await page.getByTestId('@settings/device/forget-trezor-removal-confirm').click();
        });

        await test.step('Unplug device to complete forget', async () => {
            // ThpCableConnectedForgetFlow step 3: UnplugDeviceModal
            // Power off the emulator to simulate unplugging
            await page.modal.waitFor({ state: 'visible' });
            await device.powerOff();
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
