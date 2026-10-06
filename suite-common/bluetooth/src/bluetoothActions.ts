import { createAction } from '@reduxjs/toolkit';

import { type BluetoothDeviceId } from '@trezor/connect';

import {
    type BluetoothAdapterStatus,
    type BluetoothDeviceCommon,
    type BluetoothScanStatus,
    type DeviceBluetoothConnectionStatus,
} from './types';

export const BLUETOOTH_PREFIX = '@suite/bluetooth';
type StatusParams = { status: BluetoothAdapterStatus };

const adapterEventAction = createAction(
    `${BLUETOOTH_PREFIX}/adapter-event`,
    ({ status }: StatusParams) => ({ payload: { status } }),
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
type IdParams = { id: BluetoothDeviceId };

const removeKnownDeviceAction = createAction(
    `${BLUETOOTH_PREFIX}/remove-known-device`,
    ({ id }: IdParams) => ({
        payload: { id },
    }),
);
type DeviceParams = { device: BluetoothDeviceCommon };

const deviceUpdateAction = createAction(
    `${BLUETOOTH_PREFIX}/device-update-event`,
    ({ device }: DeviceParams) => ({
        payload: { device },
    }),
);
type DeviceIdConnectionStatusParams = {
    deviceId: BluetoothDeviceId;
    connectionStatus: DeviceBluetoothConnectionStatus;
};

const updateDeviceConnectionStatus = createAction(
    `${BLUETOOTH_PREFIX}/update-device-connection-status`,
    ({ deviceId, connectionStatus }: DeviceIdConnectionStatusParams) => ({
        payload: { deviceId, connectionStatus },
    }),
);
type StatusParams2 = { status: BluetoothScanStatus };

const scanStatusAction = createAction(
    `${BLUETOOTH_PREFIX}/scan-status`,
    ({ status }: StatusParams2) => ({ payload: { status } }),
);

const enableAutoConnect = createAction(
    `${BLUETOOTH_PREFIX}/enable-auto-connect`,
    (payload?: { deviceId: BluetoothDeviceId }) => ({ payload }),
);

const setIsDeviceOsUnpairingRequired = createAction(
    `${BLUETOOTH_PREFIX}/set-is-device-os-unpairing-required`,
    (
        isDeviceOsUnpairingRequired: boolean,
        params: {
            skipToggleModalConnection?: boolean;
        } = {},
    ) => ({
        payload: {
            isDeviceOsUnpairingRequired,
            skipToggleModalConnection: Boolean(params?.skipToggleModalConnection),
        },
    }),
);

export const bluetoothActions = {
    adapterEventAction,
    nearbyDevicesUpdateAction,
    deviceUpdateAction,
    scanStatusAction,
    knownDevicesUpdateAction,
    removeKnownDeviceAction,
    updateDeviceConnectionStatus,
    enableAutoConnect,
    setIsDeviceOsUnpairingRequired,
};
