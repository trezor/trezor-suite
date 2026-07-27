import { type TrezorDevice } from '@suite-common/suite-types';
import { type Device } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { type SuiteSyncInteraction } from './suiteSyncTypes';

export const isFwUpgradeNeededForSuiteSync = (device: Device | TrezorDevice | undefined): boolean =>
    device?.unavailableCapabilities?.evolu !== undefined &&
    device.unavailableCapabilities.evolu === 'update-required';

export const isSuiteSyncSupportedByDevice = (device: Device | TrezorDevice | undefined): boolean =>
    device?.unavailableCapabilities?.evolu === undefined ||
    device.unavailableCapabilities.evolu === 'update-required';

export const getIsSuiteSyncLabelingActionEnabled = (
    suiteSyncInteraction: SuiteSyncInteraction | null,
) => {
    switch (suiteSyncInteraction) {
        case null:
        case 'suite-sync-off': // This is 2nd interaction in priority
        case 'keys-needed': // 4th
        case 'firmware-upgrade-needed': // 3rd
            return true;

        case 'unsupported': // This is 1st interaction in priority
            return false;
        default:
            return exhaustive(suiteSyncInteraction);
    }
};
