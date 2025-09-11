import { G } from '@mobily/ts-belt';
import { UnknownAction } from '@reduxjs/toolkit';
import * as semver from 'semver';

import { AnyAction } from '@suite-common/redux-utils';
import { isThpDevice } from '@suite-common/suite-utils';
import { thpActions } from '@suite-common/thp';
import { deviceConnectThunks } from '@suite-common/wallet-core';
import { Device, DeviceEvent, VersionArray } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';

export const minimalSupportedFirmwareVersion = {
    UNKNOWN: [0, 0, 0] as VersionArray,
    T1B1: [1, 12, 1] as VersionArray,
    T2T1: [2, 6, 3] as VersionArray,
    T2B1: [2, 6, 3] as VersionArray,
    T3B1: [2, 6, 3] as VersionArray,
    T3T1: [2, 6, 3] as VersionArray,
    T3W1: [2, 6, 3] as VersionArray,
} as const satisfies Record<DeviceModelInternal, VersionArray>;

export const isFirmwareVersionSupported = (
    version: VersionArray | null,
    model: DeviceModelInternal | null,
) => {
    if (G.isNullable(version) || G.isNullable(model)) return true;
    if (model === DeviceModelInternal.UNKNOWN) return true;

    const minimalVersion = minimalSupportedFirmwareVersion[model];

    if (!minimalVersion) return true;

    const versionString = version.join('.');
    const minimalVersionString = minimalVersion.join('.');

    return semver.satisfies(versionString, `>=${minimalVersionString}`);
};

export const isDeviceEventAction = <T extends DeviceEvent['type']>(
    action: AnyAction,
    actionType: T,
): action is { type: T; payload: Device } => action.type === actionType;

export const isDeviceSetupSupported = (model: DeviceModelInternal) => {
    // Exhaustive check for case that new model is introduced later it won't be forgotten.
    switch (model) {
        case DeviceModelInternal.T2B1:
        case DeviceModelInternal.T3B1:
        case DeviceModelInternal.T3T1:
        case DeviceModelInternal.T2T1:
        case DeviceModelInternal.T3W1:
            return true;
        case DeviceModelInternal.T1B1:
        case DeviceModelInternal.UNKNOWN:
            return false;
        default:
            return exhaustive(model);
    }
};

export const isDeviceConnectAction = (action: UnknownAction) => {
    // For THP, we don't use deviceConnectThunks, because THP confirmation is required before we can communicate with the device,
    // therefore we postpone until THP flow is finished.
    if (thpActions.finishThpFlow.match(action)) {
        return true;
    }

    if (deviceConnectThunks.fulfilled.match(action)) {
        const { device } = action.meta.arg;

        if (!isThpDevice(device)) {
            return true;
        }
    }

    return false;
};
