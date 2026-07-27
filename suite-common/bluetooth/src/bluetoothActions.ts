import { createAction } from '@reduxjs/toolkit';

import { type BluetoothDeviceId } from '@trezor/connect';

import {
    type BluetoothAdapterStatus,
    type BluetoothDeviceCommon,
    type BluetoothScanStatus,
    type DeviceBluetoothConnectionStatus,
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
    ({ id }: { id: BluetoothDeviceId }) => ({
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
        deviceId: BluetoothDeviceId;
        connectionStatus: DeviceBluetoothConnectionStatus;
    }) => ({
        payload: { deviceId, connectionStatus },
    }),
);

const scanStatusAction = createAction(
    `${BLUETOOTH_PREFIX}/scan-status`,
    ({ status }: { status: BluetoothScanStatus }) => ({ payload: { status } }),
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
