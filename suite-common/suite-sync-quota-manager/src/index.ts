export { createSuiteSyncQuotaManagerCompositionRoot } from './createSuiteSyncQuotaManagerCompositionRoot';
export type { EnsureQuotaDep } from './createEnsureQuota';
export type {
    AllocateOwnerQuota,
    AllocateOwnerQuotaDep,
    AllocateOwnerQuotaErr,
} from './owner/createAllocateOwnerQuota';
export type { GetOwnerHasAllowanceDep } from './owner/getOwnerHasAllowance';
export type { FetchDep } from './quotaManagerFetch';

export {
    enforceQuotaManagerUpdated,
    eraseFetchedData,
    noQuotaLeftWarningDismissed,
    suiteSyncQuotaManagerActions,
    updateQuotaManagerBaseUrl,
} from './quotaManagerActions';

export {
    selectEnforceQuotaManager,
    selectOwnersAllowance,
    selectQuotaManagerBaseUrl,
    selectRegisteredDevices,
    selectShouldDisplayOutOfQuotaAlert,
    type WithSuiteSyncQuotaManagerState,
} from './quotaManagerSelectors';

export {
    quotaManagerInitialState,
    suiteSyncQuotaManagerReducer,
    type SuiteSyncQuotaManagerState,
} from './quotaManagerReducer';

export {
    DEFAULT_QUOTA_MANAGER_URL,
    DEV_QUOTA_MANAGER_URL,
    PRODUCTION_QUOTA_MANAGER_URL,
} from './constants';
