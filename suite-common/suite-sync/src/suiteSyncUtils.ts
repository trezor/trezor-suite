import { type TrezorDevice } from '@suite-common/suite-types';
import { type Device } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';

import { type SuiteSyncInteraction } from './suiteSyncTypes';

// Signing the evolu registration request produces a secure-element attestation certificate chain,
// which is what the Quota Manager verifies. Devices without a secure element cannot produce it, so
// they cannot register with the Quota Manager. They can still derive Suite Sync keys (evoluGetNode /
// evoluGetDelegatedIdentityKey) and sync against a custom relay, which does not require QM registration.
const MODELS_WITHOUT_EVOLU_REGISTRATION_SUPPORT: DeviceModelInternal[] = [
    DeviceModelInternal.T1B1,
    DeviceModelInternal.T2T1,
];

export const canDeviceSignEvoluRegistrationRequest = (
    device: Device | TrezorDevice | undefined,
): boolean => {
    const model = device?.features?.internal_model;

    return model === undefined || !MODELS_WITHOUT_EVOLU_REGISTRATION_SUPPORT.includes(model);
};

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
