import { combineReducers } from '@reduxjs/toolkit';

import { TrezorDevice } from '@suite-common/suite-types';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { deviceActions } from '@suite-common/wallet-core';
import { Device } from '@trezor/connect';

import { BluetoothDeviceState, bluetoothActions, prepareBluetoothReducerCreator } from '../src';
import { BluetoothDeviceCommon, BluetoothState } from '../src/bluetoothReducer';

const bluetoothReducer =
    prepareBluetoothReducerCreator<BluetoothDeviceCommon>()(extraDependenciesMock);

const initialState: BluetoothState<BluetoothDeviceCommon> = {
    adapterStatus: 'unknown',
    scanStatus: 'idle',
    nearbyDevices: [] as BluetoothDeviceState<BluetoothDeviceCommon>[],
    knownDevices: [] as BluetoothDeviceCommon[],
};

const bluetoothStateDeviceA: BluetoothDeviceState<BluetoothDeviceCommon> = {
    device: {
        id: 'A',
        data: [],
        name: 'Trezor A',
        lastUpdatedTimestamp: 1,
    },
    status: { type: 'pairing' },
};

const bluetoothStateDeviceB: BluetoothDeviceState<BluetoothDeviceCommon> = {
    device: {
        id: 'B',
        data: [],
        name: 'Trezor B',
        lastUpdatedTimestamp: 2,
    },
    status: null,
};

const bluetoothStateDeviceC: BluetoothDeviceState<BluetoothDeviceCommon> = {
    device: {
        id: 'C',
        data: [],
        name: 'Trezor C',
        lastUpdatedTimestamp: 3,
    },
    status: null,
};

describe('bluetoothReducer', () => {
    it('sets the bluetooth adapter as enabled/disabled when powered/unpowered', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: { bluetooth: initialState },
        });

        expect(store.getState().bluetooth.adapterStatus).toEqual('unknown');
        store.dispatch(bluetoothActions.adapterEventAction({ isPowered: true }));
        expect(store.getState().bluetooth.adapterStatus).toEqual('enabled');
        store.dispatch(bluetoothActions.adapterEventAction({ isPowered: false }));
        expect(store.getState().bluetooth.adapterStatus).toEqual('disabled');
    });

    it('sorts the devices based on the `lastUpdatedTimestamp` and keeps the status for already existing device', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: {
                    ...initialState,
                    nearbyDevices: [bluetoothStateDeviceB, bluetoothStateDeviceA],
                },
            },
        });

        const nearbyDevices: BluetoothDeviceCommon[] = [
            bluetoothStateDeviceA.device,
            bluetoothStateDeviceC.device,
        ];

        store.dispatch(bluetoothActions.nearbyDevicesUpdateAction({ nearbyDevices }));
        expect(store.getState().bluetooth.nearbyDevices).toEqual([
            bluetoothStateDeviceC,
            // No `B` device present, it was dropped
            {
                device: bluetoothStateDeviceA.device,
                status: { type: 'pairing' }, // Keeps the pairing status
            },
        ]);
    });

    it('changes the status of the given device during pairing process', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: { ...initialState, nearbyDevices: [bluetoothStateDeviceA] },
            },
        });

        store.dispatch(
            bluetoothActions.connectDeviceEventAction({
                id: 'A',
                connectionStatus: { type: 'pairing', pin: '12345' },
            }),
        );
        expect(store.getState().bluetooth.nearbyDevices).toEqual([
            {
                device: bluetoothStateDeviceA.device,
                status: { type: 'pairing', pin: '12345' },
            },
        ]);
    });

    it('updates and removes known devices', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: { bluetooth: initialState },
        });

        const knownDeviceToAdd: BluetoothDeviceCommon[] = [
            bluetoothStateDeviceA.device,
            bluetoothStateDeviceB.device,
        ];

        store.dispatch(
            bluetoothActions.knownDevicesUpdateAction({ knownDevices: knownDeviceToAdd }),
        );
        expect(store.getState().bluetooth.knownDevices).toEqual(knownDeviceToAdd);

        store.dispatch(bluetoothActions.removeKnownDeviceAction({ id: 'A' }));

        expect(store.getState().bluetooth.knownDevices).toEqual([bluetoothStateDeviceB.device]);
    });

    it('removes device from nearbyDevices when the device is disconnected by TrezorConnect', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: { ...initialState, nearbyDevices: [bluetoothStateDeviceA] },
            },
        });

        const trezorDevice: Pick<TrezorDevice, 'bluetoothProps'> = {
            bluetoothProps: { id: 'A' },
        };

        store.dispatch(deviceActions.deviceDisconnect(trezorDevice as TrezorDevice));
        expect(store.getState().bluetooth.nearbyDevices).toEqual([]);
    });

    it('stores a device in `knownDevices` when device is connected by TrezorConnect', () => {
        const nearbyDevice: BluetoothDeviceState<BluetoothDeviceCommon> = {
            device: bluetoothStateDeviceA.device,
            status: { type: 'connected' },
        };

        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: { ...initialState, nearbyDevices: [nearbyDevice] },
            },
        });

        const trezorDevice: Pick<Device, 'bluetoothProps'> = {
            bluetoothProps: { id: 'A' },
        };

        store.dispatch(
            deviceActions.connectDevice({
                device: trezorDevice as Device,
                settings: { defaultWalletLoading: 'passphrase' },
            }),
        );
        expect(store.getState().bluetooth.knownDevices).toEqual([nearbyDevice.device]);
    });
});
