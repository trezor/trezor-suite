import { combineReducers } from '@reduxjs/toolkit';

import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { firmwareActions, prepareFirmwareReducer } from '@suite-common/firmware';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore } from '@suite-common/test-utils';

import { selectNewlyConnectedDeviceThunk } from './selectDeviceThunk';
import { handleDeviceDisconnect } from '../device/deviceThunks';

const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});
const firmwareReducer = prepareFirmwareReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const reducer = combineReducers({ device: deviceReducer, firmware: firmwareReducer });

// A device with no firmware, as the onboarding meets it: in bootloader mode from the start, so
// without a `device_id` of its own.
const DEVICE_WITHOUT_FIRMWARE = mockConnectDevice(
    { path: '1', mode: 'bootloader', descriptor: { apiType: 'usb', id: 'descriptor-bootloader' } },
    { device_id: null, bootloader_mode: true, firmware_present: false },
);
// The same device once the installation rebooted it into firmware mode, reporting the `device_id` it
// was given on its first boot and a new path, assigned by the new connection.
const DEVICE_AFTER_FRESH_INSTALLATION = mockConnectDevice(
    { path: '2', descriptor: { apiType: 'usb', id: 'descriptor-installed' } },
    { device_id: 'device-freshly-installed' },
);

const REMEMBERED_WALLET = mockSuiteDevice(
    {
        path: '',
        connected: false,
        remember: true,
        descriptor: { apiType: 'usb', id: 'descriptor-a' },
    },
    { device_id: 'device-a' },
);

// The whole slice, so that the parts the reducer keeps besides the devices are there as well.
const getDeviceState = (devices: TrezorDevice[], selectedDevice?: TrezorDevice) => ({
    ...deviceReducer(undefined, { type: 'test-init' }),
    devices,
    selectedDevice,
});

const initStore = (preloadedState?: Parameters<typeof configureMockStore>[0]['preloadedState']) =>
    configureMockStore({ extra: undefined, reducer, preloadedState });

describe('selectNewlyConnectedDeviceThunk during a firmware update', () => {
    // What #31911 was about: the device the onboarding installs firmware on is not remembered, so it
    // is dropped while it reboots and takes the selection with it. Nothing recognises it when it
    // comes back - it reports a `device_id` it did not have before - so being the only device
    // present has to be enough, or the onboarding waits for a device that is already connected.
    it('fills the selection the rebooting device left behind', async () => {
        const store = initStore();

        store.dispatch(deviceActions.connectDevice({ device: DEVICE_WITHOUT_FIRMWARE }));
        await store.dispatch(selectNewlyConnectedDeviceThunk({ device: DEVICE_WITHOUT_FIRMWARE }));

        expect(store.getState().device.selectedDevice?.path).toBe('1');

        store.dispatch(firmwareActions.setStatus('started'));

        const connected = store.getState().device.devices[0];
        if (!connected) throw new Error('the connected device is missing from the reducer');
        store.dispatch(deviceActions.deviceDisconnect(connected));
        store.dispatch(handleDeviceDisconnect(connected));

        expect(store.getState().device.selectedDevice).toBeUndefined();

        store.dispatch(deviceActions.connectDevice({ device: DEVICE_AFTER_FRESH_INSTALLATION }));
        const action = await store.dispatch(
            selectNewlyConnectedDeviceThunk({ device: DEVICE_AFTER_FRESH_INSTALLATION }),
        );

        expect(action.type).toBe(selectNewlyConnectedDeviceThunk.fulfilled.type);
        expect(store.getState().device.selectedDevice?.id).toBe('device-freshly-installed');
    });

    // The onboarding tells the user another Trezor is connected when the id it saw disconnect is not
    // the id present, so a wallet must not lose the selection to a device that cannot be matched.
    it('leaves the selection on the wallet when it cannot recognise what came back', async () => {
        const store = initStore({
            device: getDeviceState([REMEMBERED_WALLET], REMEMBERED_WALLET),
            firmware: { status: 'started' },
        });

        store.dispatch(deviceActions.connectDevice({ device: DEVICE_AFTER_FRESH_INSTALLATION }));
        const action = await store.dispatch(
            selectNewlyConnectedDeviceThunk({ device: DEVICE_AFTER_FRESH_INSTALLATION }),
        );

        expect(action.type).toBe(selectNewlyConnectedDeviceThunk.rejected.type);
        expect(action.payload).toBe('other-device-firmware-update');
        expect(store.getState().device.selectedDevice?.id).toBe('device-a');
    });

    // Only the flow suspends it: once it is over, a device connecting alone takes the selection over
    // from a wallet whose own device is not present, which is what the auto-selection is for.
    it('takes the selection over once the flow is closed', async () => {
        const store = initStore({
            device: getDeviceState([REMEMBERED_WALLET], REMEMBERED_WALLET),
        });

        store.dispatch(deviceActions.connectDevice({ device: DEVICE_AFTER_FRESH_INSTALLATION }));
        const action = await store.dispatch(
            selectNewlyConnectedDeviceThunk({ device: DEVICE_AFTER_FRESH_INSTALLATION }),
        );

        expect(action.type).toBe(selectNewlyConnectedDeviceThunk.fulfilled.type);
        expect(store.getState().device.selectedDevice?.id).toBe('device-freshly-installed');
    });
});
