import { combineReducers } from '@reduxjs/toolkit';

import { BluetoothManufacturerData } from '@suite-common/bluetooth';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { DesktopBluetoothDevice } from '../DesktopBluetoothDevice';
import {
    DesktopBluetoothState,
    bluetoothSlice,
    startConnectingBluetoothDevice,
    stopConnectingBluetoothDevice,
} from '../desktopBluetoothReducer';

const manufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T3W1,
    deviceColor: 0,
    filterPolicy: null,
};

const bluetoothReducer = bluetoothSlice.prepareReducer(extraDependenciesMock);

const initialState: DesktopBluetoothState = {
    isBluetoothListOpen: false,
    adapterStatus: 'unknown',
    scanStatus: 'idle',
    nearbyDevices: [] as DesktopBluetoothDevice[],
    knownDevices: [] as DesktopBluetoothDevice[],
    unpairedDeviceNeedsManualOsRemoval: false,
    connectingDeviceIds: [],
};

const disconnectedDeviceB: DesktopBluetoothDevice = {
    connected: false,
    macAddress: '',
    id: 'B',
    manufacturerData,
    name: 'Trezor B',
    lastUpdatedTimestamp: 2,
    connectionStatus: { type: 'disconnected' },
};

describe('desktopBluetoothReducer', () => {
    it('starts and stops the auto-connection of the device', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: { ...initialState, knownDevices: [disconnectedDeviceB] },
            },
        });

        store.dispatch(startConnectingBluetoothDevice({ deviceId: disconnectedDeviceB.id }));
        expect(store.getState().bluetooth.connectingDeviceIds).toEqual([disconnectedDeviceB.id]);

        store.dispatch(stopConnectingBluetoothDevice({ deviceId: 'non-existing-device' }));
        expect(store.getState().bluetooth.connectingDeviceIds).toEqual([disconnectedDeviceB.id]);

        store.dispatch(stopConnectingBluetoothDevice({ deviceId: disconnectedDeviceB.id }));
        expect(store.getState().bluetooth.connectingDeviceIds).toEqual([]);
    });
});
