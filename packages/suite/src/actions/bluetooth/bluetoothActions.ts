import { createAction } from '@reduxjs/toolkit';

import { BluetoothDevice } from '@trezor/transport-bluetooth';

import {
    BluetoothScanStatus,
    DeviceBluetoothStatus,
} from '../../reducers/bluetooth/bluetoothReducer';

export const BLUETOOTH_PREFIX = '@suite/bluetooth';

export const bluetoothAdapterEventAction = createAction(
    `${BLUETOOTH_PREFIX}/adapter-event`,
    ({ isPowered }: { isPowered: boolean }) => ({ payload: { isPowered } }),
);

export const bluetoothDeviceListUpdate = createAction(
    `${BLUETOOTH_PREFIX}/device-list-update`,
    ({ devices }: { devices: BluetoothDevice[] }) => ({ payload: { devices } }),
);

export const bluetoothConnectDeviceEventAction = createAction(
    `${BLUETOOTH_PREFIX}/device-connection-status`,
    ({ connectionStatus, uuid }: { uuid: string; connectionStatus: DeviceBluetoothStatus }) => ({
        payload: { uuid, connectionStatus },
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
