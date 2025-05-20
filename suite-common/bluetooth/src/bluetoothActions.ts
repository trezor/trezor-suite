import { createAction } from '@reduxjs/toolkit';

import {
    BluetoothAdapterStatus,
    BluetoothDeviceCommon,
    BluetoothScanStatus,
    DeviceBluetoothConnectionStatus,
} from './bluetoothReducer';

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

const setBluetoothDeviceNeedsManualOsRemoval = createAction(
    `${BLUETOOTH_PREFIX}/set-bluetooth-device-needs-manual-os-removal`,
    ({ needsManualRemoval }: { needsManualRemoval: boolean }) => ({
        payload: { needsManualRemoval },
    }),
);

const startConnectingBluetoothDevice = createAction(
    `${BLUETOOTH_PREFIX}/start-connecting-bluetooth-device`,
    ({ deviceId }: { deviceId: string }) => ({
        payload: { deviceId },
    }),
);

const stopConnectingBluetoothDevice = createAction(
    `${BLUETOOTH_PREFIX}/stop-connecting-bluetooth-device`,
    ({ deviceId }: { deviceId: string }) => ({
        payload: { deviceId },
    }),
);

const setBluetoothListOpen = createAction(
    `${BLUETOOTH_PREFIX}/set-bluetooth-list-open`,
    ({ isOpen }: { isOpen: boolean }) => ({
        payload: { isOpen },
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
    setBluetoothDeviceNeedsManualOsRemoval,
    startConnectingBluetoothDevice,
    stopConnectingBluetoothDevice,
    setBluetoothListOpen,
};
