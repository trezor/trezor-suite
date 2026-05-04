import { combineReducers } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { TrezorDevice } from '@suite-common/suite-types';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { Device, asBluetoothDeviceId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { bluetoothActions } from '../src/bluetoothActions';
import { prepareBluetoothReducerCreator, prepareInitialState } from '../src/bluetoothReducer';
import { BluetoothDeviceCommon, BluetoothManufacturerData } from '../src/types';

const manufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T3W1,
    deviceColor: 0,
    filterPolicy: undefined,
};

const bluetoothReducer = prepareBluetoothReducerCreator<BluetoothDeviceCommon>()(
    extraDependenciesCommonMock,
);

const initialState = prepareInitialState();

const pairingDeviceA: BluetoothDeviceCommon = {
    id: asBluetoothDeviceId('A'),
    manufacturerData,
    name: 'Trezor A',
    lastUpdatedTimestamp: 1,
    connectionStatus: { type: 'pairing' },
};

const disconnectedDeviceB: BluetoothDeviceCommon = {
    id: asBluetoothDeviceId('B'),
    manufacturerData,
    name: 'Trezor B',
    lastUpdatedTimestamp: 2,
    connectionStatus: { type: 'disconnected' },
};

const pairingErrorDevice: BluetoothDeviceCommon = {
    id: asBluetoothDeviceId('pairing-error'),
    manufacturerData,
    name: 'Trezor Pairing Error',
    lastUpdatedTimestamp: 1,
    connectionStatus: { type: 'pairing-error', error: "Can't pair this device" },
};

describe('bluetoothReducer', () => {
    it('sets the bluetooth adapter as enabled/disabled when powered/unpowered', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: { bluetooth: initialState },
        });

        expect(store.getState().bluetooth.adapterStatus).toEqual('unknown');
        store.dispatch(bluetoothActions.adapterEventAction({ status: 'enabled' }));
        expect(store.getState().bluetooth.adapterStatus).toEqual('enabled');
        store.dispatch(bluetoothActions.adapterEventAction({ status: 'disabled' }));
        expect(store.getState().bluetooth.adapterStatus).toEqual('disabled');
    });

    it('changes the status of the given device during pairing process', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: { ...initialState, nearbyDevices: [pairingDeviceA] },
            },
        });

        store.dispatch(
            bluetoothActions.deviceUpdateAction({
                device: {
                    ...pairingDeviceA,
                    connectionStatus: { type: 'pairing', pin: '12345' },
                },
            }),
        );
        expect(store.getState().bluetooth.nearbyDevices).toEqual([
            {
                ...pairingDeviceA,
                connectionStatus: { type: 'pairing', pin: '12345' },
            },
        ]);
    });

    it('updates and removes known devices', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: { bluetooth: initialState },
        });

        const knownDeviceToAdd: BluetoothDeviceCommon[] = [pairingDeviceA, disconnectedDeviceB];

        store.dispatch(
            bluetoothActions.knownDevicesUpdateAction({ knownDevices: knownDeviceToAdd }),
        );
        expect(store.getState().bluetooth.knownDevices).toEqual(knownDeviceToAdd);

        store.dispatch(bluetoothActions.removeKnownDeviceAction({ id: asBluetoothDeviceId('A') }));

        expect(store.getState().bluetooth.knownDevices).toEqual([disconnectedDeviceB]);
    });

    it('removes device from nearbyDevices when the device is disconnected by TrezorConnect', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: { ...initialState, nearbyDevices: [pairingDeviceA] },
            },
        });

        const trezorDevice: Pick<TrezorDevice, 'descriptor'> = {
            descriptor: { apiType: 'bluetooth', id: 'A' },
        };

        store.dispatch(deviceActions.deviceDisconnect(trezorDevice as TrezorDevice));
        expect(store.getState().bluetooth.nearbyDevices).toEqual([]);
    });

    it('stores a device in `knownDevices` when device is connected by TrezorConnect', () => {
        const nearbyDevice: BluetoothDeviceCommon = {
            ...pairingDeviceA,
            connectionStatus: { type: 'connected' },
        };

        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: { ...initialState, nearbyDevices: [nearbyDevice] },
            },
        });

        const trezorDevice: Pick<Device, 'descriptor'> = {
            descriptor: { apiType: 'bluetooth', id: 'A' },
        };

        store.dispatch(
            deviceActions.connectDevice({
                device: trezorDevice as Device,
            }),
        );
        expect(store.getState().bluetooth.knownDevices).toEqual([nearbyDevice]);
    });

    it('filters the error device from nearbyDevices, odds the other', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: { bluetooth: initialState },
        });

        const nearbyDevices: BluetoothDeviceCommon[] = [pairingErrorDevice, pairingDeviceA];

        store.dispatch(bluetoothActions.nearbyDevicesUpdateAction({ nearbyDevices }));
        expect(store.getState().bluetooth.nearbyDevices).toEqual([pairingDeviceA]);
    });
});
