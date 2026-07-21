import { type DeviceRootState, selectDeviceByStaticSessionId } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { type EncryptedHex } from '@suite-common/platform-encryption';
import { type SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect';

import { selectSuiteSyncCustomRelayUrl } from './relay/relayUrl';
import { type WithSuiteSyncState } from './suiteSyncSlice';
import { type SuiteSyncInteraction } from './suiteSyncTypes';
import {
    canDeviceSignEvoluRegistrationRequest,
    isFwUpgradeNeededForSuiteSync,
    isSuiteSyncSupportedByDevice,
} from './suiteSyncUtils';

export type WithSuiteSyncAndDeviceState = WithSuiteSyncState & DeviceRootState;

/** Suite Sync is enabled by default; the message system can remotely disable it via `settings.suiteSync`. */
export const selectIsSuiteSyncFeatureAvailable = (state: MessageSystemRootState) =>
    selectIsFeatureEnabled(state, Feature.suiteSync, true);

export const selectIsSuiteSyncEnabled = (
    state: WithSuiteSyncAndDeviceState & MessageSystemRootState,
): boolean =>
    state.suiteSync.settings.isSuiteSyncEnabled && selectIsSuiteSyncFeatureAvailable(state);

export const selectIsSuiteSyncDebugEnabled = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.suiteSync.settings.isSuiteSyncDebugEnabled;

export const selectIsSuiteSyncInitPossible = (
    state: WithSuiteSyncAndDeviceState,
    deviceStaticSessionId: StaticSessionId | null,
): boolean => {
    if (deviceStaticSessionId === null) {
        return false;
    }

    const device = selectDeviceByStaticSessionId(state, deviceStaticSessionId);

    if (device === undefined) {
        return false;
    }

    return (
        device.connected &&
        isSuiteSyncSupportedByDevice(device) &&
        // Devices that cannot sign the evolu registration request (e.g. Model T) can only sync
        // against a custom relay, since Quota Manager registration is not possible for them.
        (canDeviceSignEvoluRegistrationRequest(device) ||
            selectSuiteSyncCustomRelayUrl(state) !== null)
    );
};

export const selectSuiteSyncOwnerForDeviceStaticId = (
    state: WithSuiteSyncAndDeviceState,
    deviceStaticSessionId: StaticSessionId | undefined,
): EncryptedHex<SuiteSyncOwnerSerialized> | null =>
    deviceStaticSessionId !== undefined
        ? (state.suiteSync.suiteSyncOwners[deviceStaticSessionId] ?? null)
        : null;

export const selectSuiteSyncInteraction = (
    state: WithSuiteSyncAndDeviceState & MessageSystemRootState,
    deviceStaticSessionId: StaticSessionId | null,
): SuiteSyncInteraction | null => {
    if (deviceStaticSessionId === null) {
        return null;
    }

    const device = selectDeviceByStaticSessionId(state, deviceStaticSessionId);

    if (device === undefined) {
        return null;
    }

    // IMPORTANT: Order is very important here!

    if (!isSuiteSyncSupportedByDevice(device)) {
        return 'unsupported';
    }

    // Devices that cannot sign the evolu registration request (e.g. Model T) cannot register with
    // the Quota Manager, so Suite Sync is only offered when a custom relay is configured
    // (custom relays skip QM registration).
    if (
        !canDeviceSignEvoluRegistrationRequest(device) &&
        selectSuiteSyncCustomRelayUrl(state) === null
    ) {
        return 'unsupported';
    }

    if (!selectIsSuiteSyncEnabled(state)) {
        return 'suite-sync-off';
    }

    if (isFwUpgradeNeededForSuiteSync(device)) {
        return 'firmware-upgrade-needed';
    }

    if (selectSuiteSyncOwnerForDeviceStaticId(state, deviceStaticSessionId) === null) {
        return 'keys-needed';
    }

    return null;
};

export const selectHasDeviceSuiteSyncError = (
    state: WithSuiteSyncAndDeviceState,
    deviceStaticSessionId: StaticSessionId | null,
): boolean => {
    if (deviceStaticSessionId === null) {
        return false;
    }

    return state.suiteSync.suiteSyncErrors[deviceStaticSessionId] !== undefined;
};
