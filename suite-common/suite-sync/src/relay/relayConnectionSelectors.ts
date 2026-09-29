import { type WithSuiteSyncState } from '../suiteSyncSlice';

export const selectSuiteSyncRelayConnectionStatuses = (state: WithSuiteSyncState) =>
    state.suiteSync.relayConnectionStatuses;
