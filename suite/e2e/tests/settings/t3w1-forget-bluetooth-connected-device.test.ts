import { expect, test } from '../../support/fixtures';

test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

test.describe(
    'Forget TS7 currently connected via Bluetooth',
    { tag: ['@T3W1', '@desktopOnly'] },
    () => {
        /**
         * Tests the forget flow for a TS7 that is currently connected via Bluetooth
         * (thp-bt-connected flow).
         *
         * Since the emulator connects via USB, we:
         * 1. Complete onboarding with the emulator
         * 2. Dispatch a deviceChanged action with descriptor.apiType='bluetooth'
         *    so the device appears BT-connected in the store
         * 3. Inject a known BT device entry
         * 4. Click "Forget device" → triggers ThpBtConnectedForgetFlow
         * 5. After confirming, power off emulator so bleUnpair gets Device_Disconnected
         *    (which the flow treats as a successful unpair)
         * 6. Complete the BT removal modal and verify the device is forgotten
         */
        test('User can forget a BT-connected TS7 and no wallet is remembered', async ({
            onboardingPage,
            settingsPage,
            page,
            device,
        }) => {
            await onboardingPage.completeOnboarding();

            await test.step('Make device appear as BT-connected', async () => {
                await page.ensureStoreOnDesktop();

                await page.evaluate(() => {
                    const state = window.store.getState();
                    const { selectedDevice } = state.device;
                    if (!selectedDevice) {
                        throw new Error('No selected device found');
                    }

                    const devId = selectedDevice.id;

                    // The reducer ignores BT descriptor changes when a USB device
                    // is already connected (prioritizes USB). We need to patch the
                    // descriptor directly on both selectedDevice and the devices array
                    // so that getIsDeviceConnectedViaBluetooth returns true.
                    selectedDevice.descriptor = {
                        ...selectedDevice.descriptor,
                        apiType: 'bluetooth',
                    };

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
                                    connectionStatus: { type: 'connected' },
                                    deviceId: devId,
                                },
                            ],
                        },
                    });
                });
            });

            await test.step('Verify device is seen as BT-connected in Redux', async () => {
                const apiType = await page.evaluate(
                    () => window.store.getState().device.selectedDevice?.descriptor?.apiType,
                );
                if (apiType !== 'bluetooth') {
                    throw new Error(
                        `Expected descriptor.apiType to be 'bluetooth', got '${apiType}'`,
                    );
                }
            });

            await test.step('Navigate to device settings', async () => {
                await settingsPage.navigateTo('device');
            });

            await test.step('Click Forget device button', async () => {
                await page.getByTestId('@settings/device/forget-button').scrollIntoViewIfNeeded();
                await page.getByTestId('@settings/device/forget-button').click();
            });

            await test.step('Confirm forget and power off device to simulate BT disconnect', async () => {
                // ThpBtConnectedForgetFlow step 1: ConfirmationModal
                await page.modal.waitFor({ state: 'visible' });
                await page.getByTestId('@settings/device/forget-confirm').click();

                // Power off immediately so bleUnpair gets Device_Disconnected,
                // which the catch block handles and proceeds to bt-removal step
                await device.powerOff();
            });

            await test.step('Complete BT removal modal', async () => {
                // ThpBtConnectedForgetFlow step 2: RemoveFromBluetoothSettingsModal
                await page
                    .getByTestId('@settings/device/forget-bt-removal-got-it')
                    .click({ timeout: 30_000 });
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
    },
);
