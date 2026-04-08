import { type DeviceRootState, selectDeviceByStaticSessionId } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { type EncryptedHex } from '@suite-common/platform-encryption';
import { type SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect';
import { isNotNull } from '@trezor/utils';

import { type SuiteSyncServerTypeSelectValue } from './server/relayServerSettings';
import { DEFAULT_SUITE_SYNC_SERVER_URL } from './server/serverUrl';
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

export const selectSuiteSyncServerType = (
    state: WithSuiteSyncAndDeviceState,
): SuiteSyncServerTypeSelectValue => state.suiteSync.settings.suiteSyncServer.type;

export const selectSuiteSyncCustomServerUrl = (
    state: WithSuiteSyncAndDeviceState,
): string | null => {
    const { suiteSyncServer } = state.suiteSync.settings;

    if (suiteSyncServer.type !== 'custom') {
        return null;
    }

    return isNotNull(suiteSyncServer.customUrl) && suiteSyncServer.customUrl.trim() !== ''
        ? suiteSyncServer.customUrl
        : null;
};

export const selectSuiteSyncRelayUrl = (state: WithSuiteSyncAndDeviceState) =>
    selectSuiteSyncCustomServerUrl(state) ?? DEFAULT_SUITE_SYNC_SERVER_URL;

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

/** Suite Sync is enabled by default; the message system can remotely disable it via `settings.suiteSync`. */
export const selectIsSuiteSyncFeatureAvailable = (state: MessageSystemRootState) =>
    selectIsFeatureEnabled(state, Feature.suiteSync, true);
