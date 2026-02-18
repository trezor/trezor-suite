import { type DeviceRootState, selectDeviceByStaticSessionId } from '@suite-common/device';
import { type EncryptedHex } from '@suite-common/platform-encryption';
import { type SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect';
import { isNotNull } from '@trezor/utils';

import { DEFAULT_SUITE_SYNC_RELAY_URL } from './relay/relayUrl';
import { type SuiteSyncState } from './suiteSyncSlice';
import { type SuiteSyncInteraction } from './suiteSyncTypes';
import { isFwUpgradeNeededForSuiteSync, isSuiteSyncSupportedByDevice } from './suiteSyncUtils';

export type WithSuiteSyncState = {
    suiteSync: SuiteSyncState;
};

export type WithSuiteSyncAndDeviceState = WithSuiteSyncState & DeviceRootState;

export const selectIsSuiteSyncEnabled = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.suiteSync.settings.isSuiteSyncEnabled;

export const selectIsSuiteSyncDebugEnabled = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.suiteSync.settings.isSuiteSyncDebugEnabled;

export const selectSuiteSyncCustomRelayUrl = (
    state: WithSuiteSyncAndDeviceState,
): string | null => {
    const { suiteSyncRelayUrl: storedUrl } = state.suiteSync.settings;

    return isNotNull(storedUrl) && storedUrl.trim() !== '' ? storedUrl : null;
};

export const selectSuiteSyncRelayUrl = (state: WithSuiteSyncAndDeviceState) =>
    selectSuiteSyncCustomRelayUrl(state) ?? DEFAULT_SUITE_SYNC_RELAY_URL;

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
