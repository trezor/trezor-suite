import { combineReducers } from '@reduxjs/toolkit';

import { TrezorDevice } from '@suite-common/suite-types';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { deviceActions } from '@suite-common/wallet-core';
import { Device } from '@trezor/connect';

import {
    BluetoothDeviceState,
    bluetoothAdapterEventAction,
    bluetoothConnectDeviceEventAction,
    bluetoothKnownDevicesUpdateAction,
    bluetoothNearbyDevicesUpdateAction,
    bluetoothRemoveKnownDeviceAction,
    prepareBluetoothReducerCreator,
} from '../src';
import { BluetoothDeviceCommon, BluetoothState } from '../src/bluetoothReducer';

const bluetoothReducer =
    prepareBluetoothReducerCreator<BluetoothDeviceCommon>()(extraDependenciesMock);

const initialState: BluetoothState<BluetoothDeviceCommon> = {
    adapterStatus: 'unknown',
    scanStatus: 'idle',
    nearbyDevices: [] as BluetoothDeviceState<BluetoothDeviceCommon>[],
    knownDevices: [] as BluetoothDeviceCommon[],
};

describe('bluetoothReducer', () => {
    it('sets the bluetooth adapter as enabled/disabled when powered/unpowered', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: { bluetooth: initialState },
        });

        expect(store.getState().bluetooth.adapterStatus).toEqual('unknown');
        store.dispatch(bluetoothAdapterEventAction({ isPowered: true }));
        expect(store.getState().bluetooth.adapterStatus).toEqual('enabled');
        store.dispatch(bluetoothAdapterEventAction({ isPowered: false }));
        expect(store.getState().bluetooth.adapterStatus).toEqual('disabled');
    });

    it('sorts the devices based on the `lastUpdatedTimestamp` and keeps the status for already existing device', () => {
        const alreadyExistingNearbyDevice: BluetoothDeviceState<BluetoothDeviceCommon> = {
            device: {
                id: 'A',
                data: [],
                name: 'Trezor A',
                lastUpdatedTimestamp: 1,
            },
            status: { type: 'pairing' },
        };

        const nearbyDeviceToBeDropped: BluetoothDeviceState<BluetoothDeviceCommon> = {
            device: {
                id: 'B',
                data: [],
                name: 'Trezor B',
                lastUpdatedTimestamp: 2,
            },
            status: null,
        };

        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: {
                    ...initialState,
                    nearbyDevices: [nearbyDeviceToBeDropped, alreadyExistingNearbyDevice],
                },
            },
        });

        const nearbyDevices: BluetoothDeviceCommon[] = [
            {
                id: 'A',
                data: [],
                name: 'Trezor A',
                lastUpdatedTimestamp: 1,
            },
            {
                id: 'C',
                data: [],
                name: 'Trezor C',
                lastUpdatedTimestamp: 3,
            },
        ];

        store.dispatch(bluetoothNearbyDevicesUpdateAction({ nearbyDevices }));
        expect(store.getState().bluetooth.nearbyDevices).toEqual([
            {
                device: {
                    id: 'C',
                    data: [],
                    name: 'Trezor C',
                    lastUpdatedTimestamp: 3,
                },
                status: null,
            },
            // No `B` device present, it was dropped
            {
                device: {
                    id: 'A',
                    data: [],
                    name: 'Trezor A',
                    lastUpdatedTimestamp: 1,
                },
                status: { type: 'pairing' }, // Keeps the pairing status
            },
        ]);
    });

    it('changes the status of the given device during pairing process', () => {
        const nearbyDevice: BluetoothDeviceState<BluetoothDeviceCommon> = {
            device: {
                id: 'A',
                data: [],
                name: 'Trezor A',
                lastUpdatedTimestamp: 1,
            },
            status: null,
        };

        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: { ...initialState, nearbyDevices: [nearbyDevice] },
            },
        });

        store.dispatch(
            bluetoothConnectDeviceEventAction({
                id: 'A',
                connectionStatus: { type: 'pairing', pin: '12345' },
            }),
        );
        expect(store.getState().bluetooth.nearbyDevices).toEqual([
            {
                device: nearbyDevice.device,
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
            {
                id: 'A',
                data: [],
                name: 'Trezor A',
                lastUpdatedTimestamp: 1,
            },
            {
                id: 'B',
                data: [],
                name: 'Trezor B',
                lastUpdatedTimestamp: 2,
            },
        ];

        store.dispatch(bluetoothKnownDevicesUpdateAction({ knownDevices: knownDeviceToAdd }));
        expect(store.getState().bluetooth.knownDevices).toEqual(knownDeviceToAdd);

        store.dispatch(bluetoothRemoveKnownDeviceAction({ id: 'A' }));

        expect(store.getState().bluetooth.knownDevices).toEqual([
            {
                id: 'B',
                data: [],
                name: 'Trezor B',
                lastUpdatedTimestamp: 2,
            },
        ]);
    });

    it('removes device from knownDevices when the device is disconnected by TrezorConnect', () => {
        const alreadyExistingNearbyDevice: BluetoothDeviceState<BluetoothDeviceCommon> = {
            device: {
                id: 'A',
                data: [],
                name: 'Trezor A',
                lastUpdatedTimestamp: 1,
            },
            status: { type: 'connected' },
        };

        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ bluetooth: bluetoothReducer }),
            preloadedState: {
                bluetooth: { ...initialState, nearbyDevices: [alreadyExistingNearbyDevice] },
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
            device: {
                id: 'A',
                data: [],
                name: 'Trezor A',
                lastUpdatedTimestamp: 1,
            },
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
