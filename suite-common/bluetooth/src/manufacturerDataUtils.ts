import { DeviceModelInternal } from '@trezor/device-utils';

import { BluetoothFilterPolicy, BluetoothManufacturerData } from './types';

const parseDeviceModel = (bytes: number[]): DeviceModelInternal => {
    // TODO: There's a bug in FW, the device model is reversed.
    const deviceModel = String.fromCharCode(...bytes.reverse()) as DeviceModelInternal;

    return DeviceModelInternal[deviceModel] ?? DeviceModelInternal.UNKNOWN;
};

const parseFilterPolicy = (value: number): BluetoothFilterPolicy | null =>
    BluetoothFilterPolicy[value] ? (value as BluetoothFilterPolicy) : null;

/**
 * Manufacturer Specific Data
 *
 * 1st byte = filter policy
 * 2nd byte = device color, interpreted the same way as from Device Features
 * remaining four bytes = internal device model, e.g. T3W1
 */
export const parseManufacturerData = (bytes: number[]): BluetoothManufacturerData => {
    if (bytes.length !== 6) {
        return {
            deviceModel: DeviceModelInternal.UNKNOWN,
            deviceColor: 0,
            filterPolicy: null,
        };
    }

    return {
        deviceModel: parseDeviceModel(bytes.slice(2)),
        deviceColor: bytes[1],
        filterPolicy: parseFilterPolicy(bytes[0]),
    };
};

export const serializeManufacturerData = (data: BluetoothManufacturerData): number[] => [
    data.filterPolicy ?? 0,
    data.deviceColor,
    // TODO: There's a bug in FW, the device model is reversed.
    ...Array.from(data.deviceModel, char => char.charCodeAt(0)).reverse(),
];
