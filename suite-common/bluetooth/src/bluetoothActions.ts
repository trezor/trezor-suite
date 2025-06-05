import { createAction } from '@reduxjs/toolkit';

import {
    BluetoothAdapterStatus,
    BluetoothDeviceCommon,
    BluetoothScanStatus,
    DeviceBluetoothConnectionStatus,
} from './types';

export const BLUETOOTH_PREFIX = '@suite/bluetooth';

const adapterEventAction = createAction(
    `${BLUETOOTH_PREFIX}/adapter-event`,
    ({ status }: { status: BluetoothAdapterStatus }) => ({ payload: { status } }),
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

const deviceUpdateAction = createAction(
    `${BLUETOOTH_PREFIX}/device-update-event`,
    ({ device }: { device: BluetoothDeviceCommon }) => ({
        payload: { device },
    }),
);

const updateDeviceConnectionStatus = createAction(
    `${BLUETOOTH_PREFIX}/update-device-connection-status`,
    ({
        deviceId,
        connectionStatus,
    }: {
        deviceId: string;
        connectionStatus: DeviceBluetoothConnectionStatus;
    }) => ({
        payload: { deviceId, connectionStatus },
    }),
);

const scanStatusAction = createAction(
    `${BLUETOOTH_PREFIX}/scan-status`,
    ({ status }: { status: BluetoothScanStatus }) => ({ payload: { status } }),
);

export const bluetoothActions = {
    adapterEventAction,
    nearbyDevicesUpdateAction,
    deviceUpdateAction,
    scanStatusAction,
    knownDevicesUpdateAction,
    removeKnownDeviceAction,
    updateDeviceConnectionStatus,
};
