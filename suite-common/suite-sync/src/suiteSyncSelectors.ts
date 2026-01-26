import { DeviceRootState, selectDeviceByStaticSessionId } from '@suite-common/wallet-core';
import { StaticSessionId } from '@trezor/connect';

import { SuiteSyncState } from './suiteSyncSlice';
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

export type SuiteSyncInteraction =
    | 'suite-sync-off'
    | 'firmware-upgrade-needed'
    | 'unsupported'
    | 'keys-needed';

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

    if (device.suiteSyncOwner === null) {
        return 'keys-needed';
    }

    return null;
};

export const selectSuiteSyncError = (state: WithSuiteSyncAndDeviceState) =>
    !!state.suiteSync.suiteSyncError;
