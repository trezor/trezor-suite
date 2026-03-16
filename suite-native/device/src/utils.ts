import { G } from '@mobily/ts-belt';
import * as semver from 'semver';

import { type AnyAction } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import {
    getDeviceInternalModel,
    getDeviceLanguage,
    getDeviceMode,
    getIsDeviceDescriptorApiTypeBluetooth,
    getIsDevicePinProtected,
} from '@suite-common/suite-utils';
import type { AnalyticsNativeEvents } from '@suite-native/analytics';
import { events } from '@suite-native/analytics';
import { type Analytics } from '@trezor/analytics-uploader';
import { type Device, type DeviceEvent } from '@trezor/connect';
import {
    DeviceModelInternal,
    getFirmwareVersionArray,
    hasBitcoinOnlyFirmware,
} from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';
import type { VersionArray } from '@trezor/utils';

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

export const getIsDeviceSetupSupported = (model: DeviceModelInternal) => {
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

export const reportDeviceConnectionAnalytics = (
    device: TrezorDevice,
    analytics: Analytics<AnalyticsNativeEvents>,
) => {
    analytics.report({
        type: events.deviceConnectEvent.name,
        payload: {
            mode: getDeviceMode(device),
            firmwareVersion: getFirmwareVersionArray(device),
            pinProtection: getIsDevicePinProtected(device),
            isBitcoinOnly: hasBitcoinOnlyFirmware(device),
            deviceLanguage: getDeviceLanguage(device),
            deviceModel: getDeviceInternalModel(device),
            connectionType: getIsDeviceDescriptorApiTypeBluetooth(device) ? 'bluetooth' : 'cable',
        },
    });
};
