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

type BluetoothNearbyDevicesUpdateActionPayload = {
    nearbyDevices: BluetoothDevice[];
};

export const bluetoothNearbyDevicesUpdateAction = createAction(
    `${BLUETOOTH_PREFIX}/nearby-devices-update`,
    ({ nearbyDevices }: BluetoothNearbyDevicesUpdateActionPayload) => ({
        payload: { nearbyDevices },
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
};
