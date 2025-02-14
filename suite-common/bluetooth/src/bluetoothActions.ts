import { createAction } from '@reduxjs/toolkit';

import {
    BluetoothDevice,
    BluetoothScanStatus,
    DeviceBluetoothStatus,
} from './bluetoothReducerCreator';

export const BLUETOOTH_PREFIX = '@suite/bluetooth';

export const bluetoothAdapterEventAction = createAction(
    `${BLUETOOTH_PREFIX}/adapter-event`,
    ({ isPowered }: { isPowered: boolean }) => ({ payload: { isPowered } }),
);

type BluetoothDeviceListUpdatePayload = {
    devices: BluetoothDevice[];
    knownDevices: BluetoothDevice[];
};

export const bluetoothDeviceListUpdate = createAction(
    `${BLUETOOTH_PREFIX}/device-list-update`,
    ({ devices, knownDevices }: BluetoothDeviceListUpdatePayload) => ({
        payload: { devices, knownDevices },
    }),
);

export const bluetoothConnectDeviceEventAction = createAction(
    `${BLUETOOTH_PREFIX}/device-connection-status`,
    ({ connectionStatus, id }: { id: string; connectionStatus: DeviceBluetoothStatus }) => ({
        payload: { id, connectionStatus },
    }),
);

export const bluetoothScanStatusAction = createAction(
    `${BLUETOOTH_PREFIX}/scan-status`,
    ({ status }: { status: BluetoothScanStatus }) => ({ payload: { status } }),
);

export const allBluetoothActions = {
    bluetoothAdapterEventAction,
    bluetoothDeviceListUpdate,
    bluetoothConnectDeviceEventAction,
    bluetoothScanStatusAction,
};
