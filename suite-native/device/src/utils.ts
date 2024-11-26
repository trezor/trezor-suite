import { G } from '@mobily/ts-belt';
import { AnyAction } from '@reduxjs/toolkit';
import * as semver from 'semver';

import { Device, DEVICE, DeviceEvent, DeviceModelInternal, VersionArray } from '@trezor/connect';

export const minimalSupportedFirmwareVersion = {
    T1B1: [1, 12, 1] as VersionArray,
    T2T1: [2, 6, 3] as VersionArray,
    T2B1: [2, 0, 0] as VersionArray,
    T3B1: [2, 0, 0] as VersionArray,
    T3T1: [2, 0, 0] as VersionArray,
    T3W1: [2, 0, 0] as VersionArray,
} as const satisfies Record<DeviceModelInternal, VersionArray>;

export const isFirmwareVersionSupported = (
    version: VersionArray | null,
    model: DeviceModelInternal | null,
) => {
    if (G.isNullable(version) || G.isNullable(model)) return true;

    const minimalVersion = minimalSupportedFirmwareVersion[model];

    if (!minimalVersion) return true;

    const versionString = version.join('.');
    const minimalVersionString = minimalVersion.join('.');

    return semver.satisfies(versionString, `>=${minimalVersionString}`);
};

export const isAnyDeviceEventAction = (action: AnyAction): action is DeviceEvent => {
    return Object.values(DEVICE).includes(action.type);
};

export const isDeviceEventAction = <T extends DeviceEvent['type']>(
    action: AnyAction,
    actionType: T,
): action is { type: T; payload: Device } => {
    return action.type === actionType;
};
