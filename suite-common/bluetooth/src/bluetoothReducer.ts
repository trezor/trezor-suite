import { AnyAction, Draft } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { deviceActions } from '@suite-common/wallet-core';

import { bluetoothActions } from './bluetoothActions';

export type BluetoothScanStatus = 'idle' | 'running' | 'error';

export type DeviceBluetoothConnectionStatus =
    | { type: 'disconnected' }
    | { type: 'pairing'; pin?: string }
    | { type: 'paired' }
    | { type: 'connecting' }
    | { type: 'connected' }
    | {
          type: 'pairing-error'; // This device cannot be paired ever again (new macAddress, new device)
          error: string;
      }
    | {
          type: 'connection-error'; // Out-of-range, offline, in the faraday cage, ...
          error: string; // Timeout, connection aborted, ...
      };

// Do not export this outside of this suite-common package, Suite uses ist own type
// from the '@trezor/transport-bluetooth' and mobile (native) have its own type as well.
export type BluetoothDeviceCommon = {
    id: string;
    name: string;

    /**
     * Manufacturer Specific Data:
     *
     * Bytes:
     *      [0]: fist byte is advertising type.
     *             0 - advertising with whitelist,
     *             1 - without whitelist (pairing mode),
     *             2 - also pairing mode, but bond memory is full, and therefore it cannot bond another device
     *      [1]: second is device color (interpreted same way as from Device Features)
     *      [2-6]: four remaining bytes represent internal device name, i.e. T3W1
     */
    data: number[];
    lastUpdatedTimestamp: number;
    connectionStatus: DeviceBluetoothConnectionStatus;
};

export type DeviceBluetoothConnectionStatusType = DeviceBluetoothConnectionStatus['type'];

export type BluetoothAdapterStatus =
    | 'unknown'
    | 'enabled'
    | 'disabled'
    | 'permission-denied'
    | 'not-compatible';

export type BluetoothState<T extends BluetoothDeviceCommon> = {
    adapterStatus: BluetoothAdapterStatus;
    scanStatus: BluetoothScanStatus;
    nearbyDevices: T[]; // Must be sorted, newest last

    // This will be persisted, those are devices we believed that are paired
    // (because we already successfully paired them in the Suite) in the Operating System
    knownDevices: T[];
};

export const prepareBluetoothReducerCreator = <T extends BluetoothDeviceCommon>() => {
    const initialState: BluetoothState<T> = {
        adapterStatus: 'unknown',
        scanStatus: 'idle',
        nearbyDevices: [] as T[],
        knownDevices: [] as T[],
    };

    return createReducerWithExtraDeps<BluetoothState<T>>(initialState, (builder, extra) =>
        builder
            .addCase(bluetoothActions.adapterEventAction, (state, { payload: { status } }) => {
                state.adapterStatus = status;
                if (status !== 'enabled') {
                    state.nearbyDevices = [];
                    state.scanStatus = 'idle';
                }
            })
            .addCase(
                bluetoothActions.nearbyDevicesUpdateAction,
                (state, { payload: { nearbyDevices } }) => {
                    state.nearbyDevices = nearbyDevices
                        // Devices with 'pairing-error' status should NOT be displayed in the list, as it
                        // won't be possible to connect to them ever again. User has to start pairing again,
                        // which would produce a device with new id.
                        .filter(
                            nearbyDevice => nearbyDevice.connectionStatus?.type !== 'pairing-error',
                        ) as Draft<T>[];
                },
            )
            .addCase(
                bluetoothActions.updateDeviceConnectionStatus,
                (state, { payload: { deviceId, connectionStatus } }) => {
                    state.nearbyDevices = state.nearbyDevices.map(it =>
                        it.id === deviceId ? { ...it, connectionStatus } : it,
                    ) as Draft<T>[];

                    state.knownDevices = state.knownDevices.map(it =>
                        it.id === deviceId ? { ...it, connectionStatus } : it,
                    ) as Draft<T>[];
                },
            )
            .addCase(
                bluetoothActions.connectDeviceEventAction,
                (state, { payload: { device } }) => {
                    state.nearbyDevices = state.nearbyDevices.map(it =>
                        it.id === device.id ? device : it,
                    ) as Draft<T>[];

                    state.knownDevices = state.knownDevices.map(it =>
                        it.id === device.id ? device : it,
                    ) as Draft<T>[];
                },
            )
            .addCase(
                bluetoothActions.knownDevicesUpdateAction,
                (state, { payload: { knownDevices } }) => {
                    state.knownDevices = knownDevices as Draft<T>[];
                },
            )
            .addCase(bluetoothActions.removeKnownDeviceAction, (state, { payload: { id } }) => {
                state.knownDevices = state.knownDevices.filter(
                    knownDevice => knownDevice.id !== id,
                );
            })
            .addCase(bluetoothActions.scanStatusAction, (state, { payload: { status } }) => {
                state.scanStatus = status;
            })
            .addCase(deviceActions.deviceDisconnect, (state, { payload: { bluetoothProps } }) => {
                if (bluetoothProps !== undefined) {
                    state.nearbyDevices = state.nearbyDevices.filter(
                        it => it.id !== bluetoothProps.id,
                    );
                }
            })
            .addCase(
                deviceActions.connectDevice,
                (
                    state,
                    {
                        payload: {
                            device: { bluetoothProps },
                        },
                    },
                ) => {
                    if (bluetoothProps === undefined) {
                        return;
                    }

                    const device = state.nearbyDevices.find(it => it.id === bluetoothProps.id);

                    if (device !== undefined) {
                        // Once device is fully connected, we save it to the list of known devices
                        // so next time user opens suite we can automatically connect to it.
                        const foundKnownDevice = state.knownDevices.find(
                            it => it.id === bluetoothProps.id,
                        );
                        if (foundKnownDevice === undefined) {
                            state.knownDevices.push(device);
                        }
                    }
                },
            )
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                (state, action: AnyAction) => {
                    const loadedKnownDevices = (action.payload.knownDevices?.bluetooth ??
                        []) as T[];

                    state.knownDevices = loadedKnownDevices.map(
                        (it): T => ({
                            ...it,
                            connectionStatus: { type: 'disconnected' },
                        }),
                    ) as Draft<T>[];
                },
            ),
    );
};
