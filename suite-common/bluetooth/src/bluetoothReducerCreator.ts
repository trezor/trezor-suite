import { AnyAction, Draft } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { deviceActions } from '@suite-common/wallet-core';

import {
    bluetoothAdapterEventAction,
    bluetoothConnectDeviceEventAction,
    bluetoothNearbyDevicesUpdateAction,
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

export type BluetoothDevice = {
    id: string;
    name: string;
    data: number[]; // Todo: consider typed data-structure for this
    lastUpdatedTimestamp: number;
    status: DeviceBluetoothStatus | null;
};

export type DeviceBluetoothStatusType = DeviceBluetoothStatus['type'];

export type BluetoothState<T extends BluetoothDevice> = {
    adapterStatus: 'unknown' | 'enabled' | 'disabled';
    scanStatus: BluetoothScanStatus;
    nearbyDevices: T[];

    // This will be persisted, those are devices we believed that are paired
    // (because we already successfully paired them in the Suite) in the Operating System
    knownDevices: T[];
};

export const bluetoothReducerCreator = <T extends BluetoothDevice>() => {
    const initialState: BluetoothState<T> = {
        adapterStatus: 'unknown',
        scanStatus: 'idle',
        knownDevices: [] as T[],
        nearbyDevices: [] as T[],
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
                    state.nearbyDevices = nearbyDevices.sort(
                        (a, b) => a.lastUpdatedTimestamp - b.lastUpdatedTimestamp,
                    ) as Draft<T>[];
                },
            )
            .addCase(
                bluetoothConnectDeviceEventAction,
                (state, { payload: { id, connectionStatus } }) => {
                    const device = state.nearbyDevices.find(it => it.id === id);

                    if (device !== undefined) {
                        device.status = connectionStatus;
                    }
                },
            )
            .addCase(bluetoothScanStatusAction, (state, { payload: { status } }) => {
                state.scanStatus = status;
            })
            .addCase(deviceActions.deviceDisconnect, (state, { payload: { bluetoothProps } }) => {
                if (bluetoothProps) {
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
                    if (bluetoothProps && bluetoothProps.id in state.nearbyDevices) {
                        const deviceState = state.nearbyDevices.find(
                            it => it.id === bluetoothProps.id,
                        );

                        if (deviceState !== undefined) {
                            deviceState.status = null;

                            // Once device is fully connected, we save it to the list of paired devices
                            // so next time user opens suite
                            const foundPairedDevice = state.knownDevices.find(
                                it => it.id === bluetoothProps.id,
                            );
                            if (foundPairedDevice === undefined) {
                                state.knownDevices.push(deviceState);
                            }
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
