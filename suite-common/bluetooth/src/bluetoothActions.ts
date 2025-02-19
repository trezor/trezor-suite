import { createAction } from '@reduxjs/toolkit';

import {
    BluetoothDeviceCommon,
    BluetoothScanStatus,
    DeviceBluetoothStatus,
} from './bluetoothReducer';

export const BLUETOOTH_PREFIX = '@suite/bluetooth';

export const bluetoothAdapterEventAction = createAction(
    `${BLUETOOTH_PREFIX}/adapter-event`,
    ({ isPowered }: { isPowered: boolean }) => ({ payload: { isPowered } }),
);

type BluetoothNearbyDevicesUpdateActionPayload = {
    nearbyDevices: BluetoothDeviceCommon[];
};

export const bluetoothNearbyDevicesUpdateAction = createAction(
    `${BLUETOOTH_PREFIX}/nearby-devices-update`,
    ({ nearbyDevices }: BluetoothNearbyDevicesUpdateActionPayload) => ({
        payload: { nearbyDevices },
    }),
);

type BluetoothKnownDevicesUpdateActionPayload = {
    knownDevices: BluetoothDeviceCommon[];
};

export const bluetoothKnownDevicesUpdateAction = createAction(
    `${BLUETOOTH_PREFIX}/known-devices-update`,
    ({ knownDevices }: BluetoothKnownDevicesUpdateActionPayload) => ({
        payload: { knownDevices },
    }),
);

export const bluetoothRemoveKnownDeviceAction = createAction(
    `${BLUETOOTH_PREFIX}/remove-known-device`,
    ({ id }: { id: string }) => ({
        payload: { id },
    }),
);

export const bluetoothConnectDeviceEventAction = createAction(
    `${BLUETOOTH_PREFIX}/connect-device-event`,
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
    bluetoothNearbyDevicesUpdateAction,
    bluetoothConnectDeviceEventAction,
    bluetoothScanStatusAction,
    bluetoothKnownDevicesUpdateAction,
    bluetoothRemoveKnownDeviceAction,
};
