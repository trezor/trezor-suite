import { TrezorDevice } from '@suite-common/suite-types';
import { Device } from '@trezor/connect';

export const isFwUpgradeNeededForSuiteSync = (device: Device | TrezorDevice | undefined): boolean =>
    device?.unavailableCapabilities?.evolu !== undefined &&
    device.unavailableCapabilities.evolu === 'update-required';

export const isSuiteSyncSupportedByDevice = (device: Device | TrezorDevice | undefined): boolean =>
    device?.unavailableCapabilities?.evolu === undefined ||
    device.unavailableCapabilities.evolu === 'update-required';
