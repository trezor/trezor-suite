import { createReducer } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/wallet-core';
import { BluetoothDevice, DeviceConnectionStatus } from '@trezor/transport-bluetooth';
import { Without } from '@trezor/type-utils/';

import {
    bluetoothAdapterEventAction,
    bluetoothConnectDeviceEventAction,
    bluetoothDeviceListUpdate,
    bluetoothScanStatusAction,
} from '../../actions/bluetooth/bluetoothActions';
import { bluetoothStartScanningThunk } from '../../actions/bluetooth/bluetoothStartScanningThunk';
import { bluetoothStopScanningThunk } from '../../actions/bluetooth/bluetoothStopScanningThunk';

export type BluetoothScanStatus = 'running' | 'done';

export type DeviceBluetoothStatus =
    | Without<DeviceConnectionStatus, 'id'> // We have id in the deviceList map in the state
    | {
          type: 'error';
          error: string;
      }
    | {
          // This is state when device is fully connected and dashboard is shown to the user
          // At this point we can save the device to the list of paired devices for future reconnects
          type: 'connect-connected'; // Todo: Find better naming
      };

export type DeviceBluetoothStatusType = DeviceBluetoothStatus['type'];

export type BluetoothDeviceState = {
    device: BluetoothDevice;
    status: DeviceBluetoothStatus;
};

type BluetoothState = {
    isBluetoothEnabled: boolean;
    scanStatus: BluetoothScanStatus;

    // This will be persisted, those are devices we believed that are paired
    // (because we already successfully paired them in the Suite) in the Operating System
    pairedDevices: BluetoothDevice[];

    // This list of devices that is union of saved-devices and device that we get from scan
    deviceList: Record<string, BluetoothDeviceState>;
};

const initialState: BluetoothState = {
    isBluetoothEnabled: true, // To prevent the UI from flickering when the page is loaded
    scanStatus: 'running', // To prevent the UI from flickering when the page is loaded
    pairedDevices: [],
    deviceList: {},
};

export const bluetoothReducer = createReducer(initialState, builder =>
    builder
        .addCase('@storage/load', (state, rest) => {
            // @ts-expect-error typed action
            state.pairedDevices = rest.payload.knownDevices?.bluetooth || [];
        })
        .addCase(bluetoothAdapterEventAction, (state, { payload: { isPowered } }) => {
            state.isBluetoothEnabled = isPowered;
            if (!isPowered) {
                state.deviceList = {};
            }
        })
        .addCase(bluetoothDeviceListUpdate, (state, { payload: { devices } }) => {
            // update pairedDevices, id is changed after pairing (linux)
            state.pairedDevices = state.pairedDevices.reduce((prev, curr) => {
                // find devices with the same address but different id
                const changed = devices.find(d => d.address === curr.address && d.id !== curr.id);
                prev.push(changed ? { ...curr, id: changed.id } : curr);

                return prev;
            }, [] as BluetoothDevice[]);

            const newList: Record<string, BluetoothDeviceState> = Object.fromEntries(
                state.pairedDevices.map(device => [
                    device.id,
                    {
                        device,
                        status: { type: 'paired' },
                    },
                ]),
            );

            devices.forEach(device => {
                newList[device.id] = {
                    device,
                    status: state.deviceList[device.id]?.status ?? { type: 'found' },
                };
            });

            state.deviceList = newList;
        })
        .addCase(
            bluetoothConnectDeviceEventAction,
            (state, { payload: { id, connectionStatus } }) => {
                const device = state.deviceList[id];

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
                delete state.deviceList[bluetoothProps.id];
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
                if (bluetoothProps && bluetoothProps.id in state.deviceList) {
                    const deviceState = state.deviceList[bluetoothProps.id];
                    deviceState.status = { type: 'connect-connected' };

                    // Once device is fully connected, we save it to the list of paired devices
                    // so next time user opens suite
                    const foundPairedDevice = state.pairedDevices.find(
                        it => it.id === bluetoothProps.id,
                    );
                    if (foundPairedDevice === undefined) {
                        state.pairedDevices.push(deviceState.device);
                    }
                }
            },
        )
        .addCase(bluetoothStartScanningThunk.fulfilled, state => {
            state.scanStatus = 'running';
        })
        .addCase(bluetoothStopScanningThunk.fulfilled, state => {
            state.scanStatus = 'done';
        }),
);
