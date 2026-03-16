import { DeviceModelInternal } from '@trezor/device-utils';

import { type BluetoothFilterPolicy, type BluetoothManufacturerData } from './types';

// MODEL_BLE_CODE defined in trezor-firmware
// https://github.com/trezor/trezor-firmware/blob/main/core/embed/models/T3W1/model_T3W1.h#L36
const MODEL_BLE_CODE: Record<number, DeviceModelInternal> = {
    6: DeviceModelInternal.T3W1,
};

// flags defined in trezor-firmware
// https://github.com/trezor/trezor-firmware/blob/main/nordic/trezor/trezor-ble/src/ble/advertising.c#L35
const ADV_FLAG_PAIRING = 0x01;
const ADV_FLAG_BOND_MEM_FULL = 0x02;
const ADV_FLAG_DEV_CONNECTED = 0x04;
const ADV_FLAG_USER_DISCONNECT = 0x08;

const parseDeviceModel = (bytes: number): DeviceModelInternal =>
    MODEL_BLE_CODE[bytes] ?? DeviceModelInternal.UNKNOWN;

const parseFilterPolicy = (value: number): BluetoothFilterPolicy => ({
    pairing: !!(value & ADV_FLAG_PAIRING),
    bond_memory_full: !!(value & ADV_FLAG_BOND_MEM_FULL),
    connected: !!(value & ADV_FLAG_DEV_CONNECTED),
    user_disconnected: !!(value & ADV_FLAG_USER_DISCONNECT),
});

const serializeFilterPolicy = (policy?: BluetoothFilterPolicy) => {
    let value = 0;
    if (policy) {
        if (policy.pairing) {
            value |= ADV_FLAG_PAIRING;
        }
        if (policy.bond_memory_full) {
            value |= ADV_FLAG_BOND_MEM_FULL;
        }
        if (policy.connected) {
            value |= ADV_FLAG_DEV_CONNECTED;
        }
    }

    return value;
};

Object.keys(MODEL_BLE_CODE)
    .map(k => Number(k))
    .find(k => MODEL_BLE_CODE[k]);

const serializeDeviceModel = (m: DeviceModelInternal) =>
    Object.keys(MODEL_BLE_CODE)
        .map(k => Number(k))
        .find(k => MODEL_BLE_CODE[k] === m) || 0;

/**
 * Manufacturer Specific Data
 *
 * 1st byte = filter policy
 * 2nd byte = device color, interpreted the same way as from Device Features
 * 3rd byte = internal device model
 */
export const parseManufacturerData = (bytes: number[]): BluetoothManufacturerData => {
    if (bytes.length < 3) {
        return {
            deviceModel: DeviceModelInternal.UNKNOWN,
            deviceColor: 0,
            filterPolicy: undefined,
        };
    }

    return {
        deviceModel: parseDeviceModel(bytes[2]),
        deviceColor: bytes[1],
        filterPolicy: parseFilterPolicy(bytes[0]),
    };
};

export const serializeManufacturerData = (data: BluetoothManufacturerData): number[] => [
    serializeFilterPolicy(data.filterPolicy),
    data.deviceColor,
    serializeDeviceModel(data.deviceModel),
];
