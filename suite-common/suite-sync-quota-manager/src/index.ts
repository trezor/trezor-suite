export { createSuiteSyncQuotaManagerCompositionRoot } from './createSuiteSyncQuotaManagerCompositionRoot';
export type { EnsureQuotaDep } from './createEnsureQuota';
export type {
    AllocateOwnerQuota,
    AllocateOwnerQuotaDep,
    AllocateOwnerQuotaErr,
} from './owner/createAllocateOwnerQuota';
export type { GetOwnerHasAllowanceDep } from './owner/getOwnerHasAllowance';
export type { FetchDep } from './quotaManagerFetch';
export type { GetQuotaManagerUrl, GetQuotaManagerUrlDep } from './quotaManagerUrl';

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
    selectRegisteredDevices,
    selectShouldDisplayOutOfQuotaAlert,
    type WithSuiteSyncQuotaManagerState,
} from './quotaManagerSelectors';
export {
    getQuotaManagerDefaultUrl,
    getQuotaManagerUrl,
    selectQuotaManagerCustomUrl,
    selectQuotaManagerUrl,
} from './quotaManagerUrl';

export {
    quotaManagerInitialState,
    suiteSyncQuotaManagerReducer,
    type SuiteSyncQuotaManagerState,
} from './quotaManagerReducer';
export {
    DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA,
    DEFAULT_ACCOUNT_SIZE_QUOTA,
    DEFAULT_DEVICE_SIZE_QUOTA,
} from './quotaManagerQuotaSize';
