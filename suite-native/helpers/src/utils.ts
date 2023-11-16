import { A, G } from '@mobily/ts-belt';

import { DeviceModelInternal, VersionArray } from '@trezor/connect';

export const minimalSupportedFirmwareVersion = {
    T1B1: [1, 12, 1] as VersionArray,
    T2T1: [2, 6, 3] as VersionArray,
    T2B1: [2, 6, 3] as VersionArray,
} as const satisfies Record<DeviceModelInternal, VersionArray>;

export const isFirmwareVersionSupported = (
    version: VersionArray | null,
    model: DeviceModelInternal | null,
) => {
    if (G.isNullable(version) || G.isNullable(model)) return true;

    const minimalVersion = minimalSupportedFirmwareVersion[model];

    if (!minimalVersion) return true;

    return A.every(
        version.map((v, i) => v >= minimalVersion[i]),
        val => val,
    );
};
