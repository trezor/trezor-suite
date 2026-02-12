import { DeviceRootState, selectDeviceByStaticSessionId } from '@suite-common/device';
import { EncryptedHex } from '@suite-common/platform-encryption';
import { SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { StaticSessionId } from '@trezor/connect';

import { SuiteSyncState } from './suiteSyncSlice';
import { SuiteSyncInteraction } from './suiteSyncTypes';
import { isFwUpgradeNeededForSuiteSync, isSuiteSyncSupportedByDevice } from './suiteSyncUtils';

export type WithSuiteSyncState = {
    suiteSync: SuiteSyncState;
};

export type WithSuiteSyncAndDeviceState = WithSuiteSyncState & DeviceRootState;

export const selectIsSuiteSyncEnabled = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.suiteSync.settings.isSuiteSyncEnabled;

export const selectIsSuiteSyncDebugEnabled = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.suiteSync.settings.isSuiteSyncDebugEnabled;

export const selectSuiteSyncRelayUrl = (state: WithSuiteSyncAndDeviceState) =>
    state.suiteSync.settings.suiteSyncRelayUrl;

export const selectSuiteSyncOwnerForDeviceStaticId = (
    state: WithSuiteSyncAndDeviceState,
    deviceStaticSessionId: StaticSessionId | undefined,
): EncryptedHex<SuiteSyncOwnerSerialized> | null =>
    deviceStaticSessionId !== undefined
        ? (state.suiteSync.suiteSyncOwners[deviceStaticSessionId] ?? null)
        : null;

export const selectSuiteSyncInteraction = (
    state: WithSuiteSyncAndDeviceState,
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
