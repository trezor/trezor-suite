import { combineReducers } from '@reduxjs/toolkit';

import { type BluetoothManufacturerData } from '@suite-common/bluetooth';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { asBluetoothDeviceId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import {
    initialDesktopBluetoothState,
    prepareDesktopBluetoothReducer,
    startConnectingBluetoothDevice,
    stopConnectingBluetoothDevice,
} from './desktopBluetoothReducer';

const manufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T3W1,
    deviceColor: 0,
    filterPolicy: undefined,
};

const bluetoothReducer = prepareDesktopBluetoothReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const disconnectedDeviceB: DesktopBluetoothDevice = {
    id: asBluetoothDeviceId('B'),
    macAddress: '',
    manufacturerData,
    name: 'Trezor B',
    lastUpdatedTimestamp: 2,
    connectionStatus: { type: 'disconnected' },
};

describe('desktopBluetoothReducer', () => {
    it('starts and stops the auto-connection of the device', () => {
        const store = createTestStore({
            extra: undefined,
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: { ...initialDesktopBluetoothState, knownDevices: [disconnectedDeviceB] },
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
