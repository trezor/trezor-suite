import { SuiteSyncQuotaManagerState } from './quotaManagerReducer';

type WithSuiteSyncQuotaManagerState = {
    suiteSyncQuotaManager: SuiteSyncQuotaManagerState;
};

export const selectQuotaManagerBaseUrl = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.baseUrl;

export const selectQuotaManagerSessionId = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.sessionId;

export const selectQuotaManagerChallenge = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.challenge;
