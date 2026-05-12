import { type DeviceRootState, selectDeviceByStaticSessionId } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { type EncryptedHex } from '@suite-common/platform-encryption';
import { createWeakMapSelector } from '@suite-common/redux-utils';
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

const createMemoizedSelector = createWeakMapSelector.withTypes<
    WithSuiteSyncAndDeviceState & MessageSystemRootState
>();

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

    return device.connected && isSuiteSyncSupportedByDevice(device);
};

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

export const selectSuiteSyncInteraction = createMemoizedSelector(
    [
        (
            _state: WithSuiteSyncAndDeviceState & MessageSystemRootState,
            deviceStaticSessionId: StaticSessionId | null,
        ) => deviceStaticSessionId,
        (state, deviceStaticSessionId) =>
            deviceStaticSessionId !== null
                ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
                : undefined,
        selectIsSuiteSyncEnabled,
        (state, deviceStaticSessionId) =>
            deviceStaticSessionId !== null
                ? selectSuiteSyncOwnerForDeviceStaticId(state, deviceStaticSessionId)
                : null,
    ],
    (deviceStaticSessionId, device, isSuiteSyncEnabled, owner): SuiteSyncInteraction | null => {
        if (deviceStaticSessionId === null) {
            return null;
        }

        if (device === undefined) {
            return null;
        }

        // IMPORTANT: Order is very important here!

        if (!isSuiteSyncSupportedByDevice(device)) {
            return 'unsupported';
        }

        if (!isSuiteSyncEnabled) {
            return 'suite-sync-off';
        }

        if (isFwUpgradeNeededForSuiteSync(device)) {
            return 'firmware-upgrade-needed';
        }

        if (owner === null) {
            return 'keys-needed';
        }

        return null;
    },
);

export const selectHasDeviceSuiteSyncError = (
    state: WithSuiteSyncAndDeviceState,
    deviceStaticSessionId: StaticSessionId | null,
): boolean => {
    if (deviceStaticSessionId === null) {
        return false;
    }

    return state.suiteSync.suiteSyncErrors[deviceStaticSessionId] !== undefined;
};
