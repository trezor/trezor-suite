import { combineReducers } from '@reduxjs/toolkit';

import { type BluetoothManufacturerData } from '@suite-common/bluetooth';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { asBluetoothDeviceId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { type DesktopBluetoothDevice } from '../DesktopBluetoothDevice';
import {
    bluetoothSlice,
    initialDesktopBluetoothState,
    startConnectingBluetoothDevice,
    stopConnectingBluetoothDevice,
} from '../desktopBluetoothReducer';

const manufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T3W1,
    deviceColor: 0,
    filterPolicy: undefined,
};

const bluetoothReducer = bluetoothSlice.prepareReducer(extraDependenciesCommonMock);

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
        const store = configureMockStore({
            extra: {},
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
