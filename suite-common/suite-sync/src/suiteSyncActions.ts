import { createAction } from '@reduxjs/toolkit';
export const SUITE_SYNC_PREFIX = '@suite/suite-sync';

export const updateSuiteSyncEnabled = createAction(
    `${SUITE_SYNC_PREFIX}/update-suite-sync-enabled`,
    (payload: { isEnabled: boolean }) => ({ payload }),
);

export const updateSuiteSyncDebugEnabled = createAction(
    `${SUITE_SYNC_PREFIX}/update-suite-sync-debug-enabled`,
    (payload: { isEnabled: boolean }) => ({ payload }),
);

export const updateIsFeatureSuiteSyncAvailable = createAction(
    `${SUITE_SYNC_PREFIX}/update-is-feature-suite-sync-available`,
    (payload: { isShownInSettings: boolean }) => ({ payload }),
);

/** @deprecated this shall be called only from `changeRelayUrlThunk`, use the thunk only */
export const setSuiteSyncRelayUrl = createAction(
    `${SUITE_SYNC_PREFIX}/set-suite-sync-relay-url`,
    (payload: { url: string | null }) => ({ payload }),
);

export const suiteSyncActions = {
    updateSuiteSyncEnabled,
    updateSuiteSyncDebugEnabled,
    updateIsFeatureSuiteSyncAvailable,
    /** @deprecated this shall be called only from `changeRelayUrlThunk`, use the thunk only */
    setSuiteSyncRelayUrl,
};
