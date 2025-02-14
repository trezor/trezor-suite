import { AnyAction, Draft } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { deviceActions } from '@suite-common/wallet-core';

import {
    bluetoothAdapterEventAction,
    bluetoothConnectDeviceEventAction,
    bluetoothDeviceListUpdate,
    bluetoothScanStatusAction,
} from './bluetoothActions';

export type BluetoothScanStatus = 'running' | 'done' | 'error';

export type BluetoothDevice = {
    id: string;
    name: string;
    data: number[];
    lastUpdate: number;
    status: DeviceBluetoothStatus | null;
};

export type DeviceBluetoothStatus =
    | { type: 'pairing'; pin?: string }
    | { type: 'paired' }
    | { type: 'connecting' }
    | { type: 'connected' }
    | {
          type: 'error';
          error: string;
      };

export type DeviceBluetoothStatusType = DeviceBluetoothStatus['type'];

type BluetoothState<T extends BluetoothDevice> = {
    isAdapterEnabled: boolean;
    scanStatus: BluetoothScanStatus;

    // This will be persisted, those are devices we believed that are paired
    // (because we already successfully paired them in the Suite) in the Operating System
    knownDevices: T[];

    // This list of devices that is union of saved-devices and device that we get from scan
    devices: T[];
};

export const bluetoothReducerCreator = <T extends BluetoothDevice>() => {
    const initialState: BluetoothState<T> = {
        isAdapterEnabled: true, // To prevent the UI from flickering when the page is loaded
        scanStatus: 'running', // To prevent the UI from flickering when the page is loaded
        knownDevices: [] as T[],
        devices: [] as T[],
    };

    return createReducerWithExtraDeps<BluetoothState<T>>(initialState, (builder, extra) =>
        builder
            .addCase(bluetoothAdapterEventAction, (state, { payload: { isPowered } }) => {
                state.isAdapterEnabled = isPowered;
                if (!isPowered) {
                    state.devices = [];
                }
            })
            .addCase(bluetoothDeviceListUpdate, (state, { payload: { devices, knownDevices } }) => {
                const newList = new Map<string, T>();
                knownDevices.forEach(device => {
                    newList.set(device.id, device as T);
                });

                state.knownDevices = knownDevices as Draft<T>[];

                devices.forEach(device => {
                    newList.set(device.id, device as T);
                });

                state.devices = Array.from(newList.values()).sort(
                    (a, b) => a.lastUpdate - b.lastUpdate,
                ) as Draft<T>[];
            })
            .addCase(
                bluetoothConnectDeviceEventAction,
                (state, { payload: { id, connectionStatus } }) => {
                    const device = state.devices.find(it => it.id === id);

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
                    state.devices = state.devices.filter(it => it.id !== bluetoothProps.uuid);
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
                    if (bluetoothProps && bluetoothProps.uuid in state.devices) {
                        const deviceState = state.devices.find(it => it.id === bluetoothProps.uuid);

                        if (deviceState !== undefined) {
                            deviceState.status = null;

                            // Once device is fully connected, we save it to the list of paired devices
                            // so next time user opens suite
                            const foundPairedDevice = state.knownDevices.find(
                                it => it.id === bluetoothProps.uuid,
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
                    state.knownDevices = action.payload.knownDevices?.bluetooth;
                },
            ),
    );
};
