import { AnyAction, Draft } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { deviceActions } from '@suite-common/wallet-core';

import {
    bluetoothAdapterEventAction,
    bluetoothConnectDeviceEventAction,
    bluetoothKnownDevicesUpdateAction,
    bluetoothNearbyDevicesUpdateAction,
    bluetoothRemoveKnownDeviceAction,
    bluetoothScanStatusAction,
} from './bluetoothActions';

export type BluetoothScanStatus = 'idle' | 'running' | 'error';

export type DeviceBluetoothStatus =
    | { type: 'pairing'; pin?: string }
    | { type: 'paired' }
    | { type: 'connecting' }
    | { type: 'connected' }
    | {
          type: 'error';
          error: string;
      };

// Do not export this outside of this suite-common package, Suite uses ist own type
// from the '@trezor/transport-bluetooth' and mobile (native) have its own type as well.
export type BluetoothDeviceCommon = {
    id: string;
    name: string;
    data: number[]; // Todo: consider typed data-structure for this
    lastUpdatedTimestamp: number;
};

export type DeviceBluetoothStatusType = DeviceBluetoothStatus['type'];

export type BluetoothState<T extends BluetoothDeviceCommon> = {
    adapterStatus: 'unknown' | 'enabled' | 'disabled';
    scanStatus: BluetoothScanStatus;
    nearbyDevices: Array<{ device: T; status: DeviceBluetoothStatus | null }>;

    // This will be persisted, those are devices we believed that are paired
    // (because we already successfully paired them in the Suite) in the Operating System
    knownDevices: T[];
};

export type BluetoothDeviceState<T extends BluetoothDeviceCommon> = {
    device: T;
    status: DeviceBluetoothStatus | null;
};

export const prepareBluetoothReducerCreator = <T extends BluetoothDeviceCommon>() => {
    const initialState: BluetoothState<T> = {
        adapterStatus: 'unknown',
        scanStatus: 'idle',
        nearbyDevices: [] as BluetoothDeviceState<T>[],
        knownDevices: [] as T[],
    };

    return createReducerWithExtraDeps<BluetoothState<T>>(initialState, (builder, extra) =>
        builder
            .addCase(bluetoothAdapterEventAction, (state, { payload: { isPowered } }) => {
                state.adapterStatus = isPowered ? 'enabled' : 'disabled';
                if (!isPowered) {
                    state.nearbyDevices = [];
                    state.scanStatus = 'idle';
                }
            })
            .addCase(
                bluetoothNearbyDevicesUpdateAction,
                (state, { payload: { nearbyDevices } }) => {
                    state.nearbyDevices = nearbyDevices
                        .sort((a, b) => b.lastUpdatedTimestamp - a.lastUpdatedTimestamp)
                        .map(
                            (device): Draft<BluetoothDeviceState<T>> => ({
                                device: device as Draft<T>,
                                status:
                                    state.nearbyDevices.find(it => it.device.id === device.id)
                                        ?.status ?? null,
                            }),
                        );
                },
            )
            .addCase(
                bluetoothConnectDeviceEventAction,
                (state, { payload: { id, connectionStatus } }) => {
                    const device = state.nearbyDevices.find(it => it.device.id === id);

                    if (device !== undefined) {
                        device.status = connectionStatus;
                    }
                },
            )
            .addCase(bluetoothKnownDevicesUpdateAction, (state, { payload: { knownDevices } }) => {
                state.knownDevices = knownDevices as Draft<T>[];
            })
            .addCase(bluetoothRemoveKnownDeviceAction, (state, { payload: { id } }) => {
                state.knownDevices = state.knownDevices.filter(
                    knownDevice => knownDevice.id !== id,
                );
            })
            .addCase(bluetoothScanStatusAction, (state, { payload: { status } }) => {
                state.scanStatus = status;
            })
            .addCase(deviceActions.deviceDisconnect, (state, { payload: { bluetoothProps } }) => {
                if (bluetoothProps !== undefined) {
                    state.nearbyDevices = state.nearbyDevices.filter(
                        it => it.device.id !== bluetoothProps.id,
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

                    const deviceState = state.nearbyDevices.find(
                        it => it.device.id === bluetoothProps.id,
                    );

                    if (deviceState !== undefined) {
                        // Once device is fully connected, we save it to the list of known devices
                        // so next time user opens suite we can automatically connect to it.
                        const foundKnownDevice = state.knownDevices.find(
                            it => it.id === bluetoothProps.id,
                        );
                        if (foundKnownDevice === undefined) {
                            state.knownDevices.push(deviceState.device);
                        }
                    }
                },
            )
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                (state, action: AnyAction) => {
                    state.knownDevices = action.payload.knownDevices?.bluetooth ?? [];
                },
            ),
    );
};
