import { Page, expect, test } from '@playwright/test';

/**
 * Mocks a Bluetooth device context by synchronizing the Device Manager and Bluetooth Manager state.
 *
 * This class provides a "State-Level Mock" that forces a Trezor device into a specific connection
 * state (USB or Bluetooth) and injects a simulated pairing history into the application.
 *
 * --- WHY THIS IS NECESSARY ---
 * Trezor Suite's state is divided into multiple "Silos" (Reducers). To simulate a Bluetooth device,
 * you must simultaneously update the active device status, the Bluetooth pairing history,
 * and the persistence layer.
 *
 * --- HARDWARE CONFLICT ---
 * When testing with a live USB emulator, the transport layer will attempt to overwrite the
 * Redux state with the "Physical Reality" (resetting apiType back to 'usb').
 *
 * To test a "Disconnected" state successfully:
 * 1. Call `await device.powerOff()` first to stop the hardware signal.
 * 2. THEN call `await page.mockDeviceBluetoothState({ isConnected: false })`.
 *
 * --- USE CASES ---
 * - Forget Device Flow: Verifies "Unplug" vs "Bluetooth Cleanup" modal transitions.
 * - Header Icons: Verifies that the correct Bluetooth/USB status icons are shown.
 * - Device Selector: Verifies that "Remembered" Bluetooth devices are displayed correctly.
 */

export interface MockBluetoothOptions {
    bluetoothId?: string;
    isConnected?: boolean;
    apiType?: 'bluetooth' | 'usb';
}

export interface ExpectDeviceStateOptions {
    connected: boolean;
    apiType: 'bluetooth' | 'usb';
}

interface EvaluatePayload {
    id: string;
    connected: boolean;
    type: 'bluetooth' | 'usb';
}

export class DeviceStateMock {
    constructor(private page: Page) {}

    /**
     * Mocks a Bluetooth device context by synchronizing the Device Manager and Bluetooth Manager.
     *
     * @param options configuration for the mock
     * @param options.bluetoothId The simulated MAC address (e.g., '00:11:22...').
     * @param options.apiType The active protocol. Use 'usb' to test devices plugged in that have BT history.
     * @param options.isConnected Current connection status. Note: 'false' may be overwritten by a live emulator unless device.powerOff() is called first.
     */
    async mockBluetooth(options: MockBluetoothOptions = {}) {
        const {
            bluetoothId = '00:11:22:33:44:55',
            isConnected = true,
            apiType = 'bluetooth',
        } = options;

        const payload: EvaluatePayload = {
            id: bluetoothId,
            connected: isConnected,
            type: apiType,
        };

        await test.step(`Mock Bluetooth Device State (${apiType}, ${isConnected ? 'Connected' : 'Disconnected'})`, async () => {
            await this.page.ensureStoreOnDesktop();
            await this.page.evaluate(this.syncDeviceAndBluetoothState, payload);
        });
    }

    /**
     * Verifies the core connection state of the selected device in Redux.
     * Note: For disconnected devices, apiType is often reset to 'usb' by the hardware
     * layer even if the mock tried to set it to 'bluetooth'.
     */
    async expectDeviceState(expected: ExpectDeviceStateOptions) {
        await test.step(`Verify Device State (connected: ${expected.connected}, type: ${expected.apiType})`, async () => {
            const device = await this.page.getReduxObject('device.selectedDevice');

            expect(device.connected, 'Device connection status mismatch').toBe(expected.connected);

            // For disconnected ones, we accept 'usb' due to hardware reset reality.
            if (expected.connected) {
                expect(device.descriptor.apiType, 'Device API type mismatch').toBe(
                    expected.apiType,
                );
            }
        });
    }

    /**
     * Performs the internal Redux synchronization to mock a Bluetooth device context.
     *
     * This method requires three separate dispatches to satisfy the app's internal logic
     * and ensure a consistent state across different "Silos" (Reducers):
     *
     * 1. '@device/update-selected-device': Updates the primary Device Reducer (UI State).
     *    This ensures the 'thp' property exists (forcing modern TS7 flows) and sets
     *    the initial 'apiType' and 'connected' status.
     *
     * 2. '@suite/bluetooth/known-devices-update': Populates the Bluetooth Reducer (History).
     *    This injects the "Pairing Footprint" into the computer's simulated OS settings,
     *    which is what triggers the "Bluetooth Cleanup" modals during the Forget flow.
     *
     * 3. '@device/device-changed': Updates the Persistence Layer (Background Logic).
     *    This ensures the app "remembers" the connection type and prevents the device
     *    from being immediately overwritten or forgotten by background transport tasks.
     *
     * @param payload Internal state mapping for the browser execution context.
     */
    private syncDeviceAndBluetoothState(payload: EvaluatePayload) {
        const { id, connected, type } = payload;
        const { store } = window;
        const state = store.getState();
        const { selectedDevice } = state.device;

        if (!selectedDevice) {
            throw new Error('DeviceStateMock: No device selected.');
        }

        // Update DEVICE REDUCER
        const modifiedDevice = {
            ...selectedDevice,
            thp: selectedDevice.thp ?? {},
            remember: true,
            connected,
            descriptor: {
                ...selectedDevice.descriptor,
                apiType: type,
                id: type === 'bluetooth' ? id : selectedDevice.descriptor.id,
            },
        };

        // Update BLUETOOTH REDUCER (THE HISTORY)
        const mockKnownDevice = {
            id,
            deviceId: selectedDevice.id,
            name: selectedDevice.name,
            connectionStatus: { type: connected ? 'connected' : 'disconnected' },
            manufacturerData: {
                deviceModel: selectedDevice.features.internal_model,
                deviceColor: selectedDevice.features.unit_color,
            },
            lastUpdatedTimestamp: Date.now(),
        };

        // 1. Update UI state for the selected device
        store.dispatch({
            type: '@device/update-selected-device',
            payload: modifiedDevice,
        });

        // 2. Mock Bluetooth pairing history in the Bluetooth manager
        store.dispatch({
            type: '@suite/bluetooth/known-devices-update',
            payload: { knownDevices: [mockKnownDevice] },
        });

        // 3. Update persistence layer so the app "remembers" the device and its connection type
        store.dispatch({
            type: '@device/device-changed',
            payload: modifiedDevice,
        });
    }
}
