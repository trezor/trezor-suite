import { blake2s } from '@noble/hashes/blake2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

import { DeviceModelInternal } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

// Size values are taken from
// https://github.com/trezor/trezor-firmware/blob/56f9490c01b40e99d94fe5d8a283955800d86562/core/embed/models/T3T1/memory.h#L62
// and the calculation reflects the internal memory layout.
// We keep size values expanded even though the result is the same for all core models except T3W1.
const SIZE_T1B1 = (7 * 128 + 64) * 1024; // 960 kB
const SIZE_T2T1 = 13 * 128 * 1024; // 1664 kB
const SIZE_T2B1 = 13 * 128 * 1024; // 1664 kB
const SIZE_T3B1 = 208 * 8 * 1024; // 1664 kB
const SIZE_T3T1 = 208 * 8 * 1024; // 1664 kB
const SIZE_T3W1 = 417 * 8 * 1024; // 3336 kB

const firmwareSizeMap: Partial<Record<DeviceModelInternal, number>> = {
    [DeviceModelInternal.T1B1]: SIZE_T1B1,
    [DeviceModelInternal.T2T1]: SIZE_T2T1,
    [DeviceModelInternal.T2B1]: SIZE_T2B1,
    [DeviceModelInternal.T3B1]: SIZE_T3B1,
    [DeviceModelInternal.T3T1]: SIZE_T3T1,
    [DeviceModelInternal.T3W1]: SIZE_T3W1,
};

type CalculateFirmwareHashParams = {
    internal_model: DeviceModelInternal;
    fw: ArrayBuffer;
    firmwareVersion: VersionArray;
    key?: Buffer;
};

const getSizeForModel = ({
    internal_model,
    firmwareVersion,
}: Pick<CalculateFirmwareHashParams, 'firmwareVersion' | 'internal_model'>) => {
    // Default is SIZE_T1B1 since some old T1 do not report internal_model.
    const size = firmwareSizeMap[internal_model] ?? SIZE_T1B1;

    // Fix for T3W1 2.9.3, which had a bug causing the calculated area to be 16kB smaller.
    // This can be removed once 2.9.3 is no longer supported.
    if (
        firmwareVersion !== undefined &&
        internal_model === DeviceModelInternal.T3W1 &&
        versionUtils.isEqual(firmwareVersion, [2, 9, 3])
    ) {
        return size - 16 * 1024;
    }

    return size;
};

export const calculateFirmwareHash = ({
    internal_model,
    firmwareVersion,
    fw,
    key,
}: CalculateFirmwareHashParams) => {
    // Default is SIZE_T1B1 since some old T1 do not report internal_model.
    const size = getSizeForModel({ internal_model, firmwareVersion });

    const padding = size - fw.byteLength;
    if (padding < 0) {
        throw new Error('Firmware too big');
    }
    const data = new Uint8Array(new ArrayBuffer(size));
    data.set(new Uint8Array(fw));
    if (padding > 0) {
        const zeroBytes = Buffer.alloc(padding);
        zeroBytes.fill(Buffer.from('ff', 'hex'));
        data.set(zeroBytes, fw.byteLength);
    }

    return {
        hash:
            key && key.length > 0 ? bytesToHex(blake2s(data, { key })) : bytesToHex(blake2s(data)),
        challenge: key ? key.toString('hex') : '',
    };
};
