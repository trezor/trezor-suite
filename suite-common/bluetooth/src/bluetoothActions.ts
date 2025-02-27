import { createAction } from '@reduxjs/toolkit';

import { BluetoothDeviceCommon, BluetoothScanStatus } from './bluetoothReducer';

export const BLUETOOTH_PREFIX = '@suite/bluetooth';

const adapterEventAction = createAction(
    `${BLUETOOTH_PREFIX}/adapter-event`,
    ({ isPowered }: { isPowered: boolean }) => ({ payload: { isPowered } }),
);

type BluetoothNearbyDevicesUpdateActionPayload = {
    nearbyDevices: BluetoothDeviceCommon[];
};

const nearbyDevicesUpdateAction = createAction(
    `${BLUETOOTH_PREFIX}/nearby-devices-update`,
    ({ nearbyDevices }: BluetoothNearbyDevicesUpdateActionPayload) => ({
        payload: { nearbyDevices },
    }),
);

type BluetoothKnownDevicesUpdateActionPayload = {
    knownDevices: BluetoothDeviceCommon[];
};

const knownDevicesUpdateAction = createAction(
    `${BLUETOOTH_PREFIX}/known-devices-update`,
    ({ knownDevices }: BluetoothKnownDevicesUpdateActionPayload) => ({
        payload: { knownDevices },
    }),
);

const removeKnownDeviceAction = createAction(
    `${BLUETOOTH_PREFIX}/remove-known-device`,
    ({ id }: { id: string }) => ({
        payload: { id },
    }),
);

const connectDeviceEventAction = createAction(
    `${BLUETOOTH_PREFIX}/connect-device-event`,
    ({ device }: { device: BluetoothDeviceCommon }) => ({
        payload: { device },
    }),
);

const scanStatusAction = createAction(
    `${BLUETOOTH_PREFIX}/scan-status`,
    ({ status }: { status: BluetoothScanStatus }) => ({ payload: { status } }),
);

export const bluetoothActions = {
    adapterEventAction,
    nearbyDevicesUpdateAction,
    connectDeviceEventAction,
    scanStatusAction,
    knownDevicesUpdateAction,
    removeKnownDeviceAction,
};
