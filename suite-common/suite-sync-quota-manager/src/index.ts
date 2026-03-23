/**
 * QuotaManager API thunks / functions.
 */
export { checkStorageByOwnerId, checkStorageByPublicKey } from './storage/checkStorage';
export { registerStorageThunk } from './storage/registerStorageThunk';
export { transferStorageThunk } from './storage/transferStorageThunk';
export { prepareChallengeSession } from './challenge/prepareChallengeSession';
export { ensureDeviceHasQuotaThunk } from './ensureDeviceHasQuotaThunk';
export {
    ensureOwnerHasAllocatedQuotaThunk,
    WriteModeRequiredForAllocation,
} from './ensureOwnerHasAllocatedQuotaThunk';
export { increaseOwnerQuotaThunk } from './increaseOwnerQuotaThunk';

/**
 * Actions.
 */
export {
    updateQuotaManagerBaseUrl,
    quotaManagerDeviceFetched,
    quotaManagerFetchError,
    suiteSyncQuotaManagerActions,
    eraseFetchedData,
    noQuotaLeftWarningDismissed,
    enforceQuotaManagerUpdated,
} from './quotaManagerActions';

/**
 * Selectors.
 */
export {
    selectQuotaManagerBaseUrl,
    selectOwnersAllowance,
    selectRegisteredDevices,
    selectIsDeviceRegistered,
    selectHasOwnerAllowance,
    selectHasDeviceAllowance,
    selectLeftDeviceQuota,
    selectDeviceDismissedNoQuotaLeftWarning,
    selectShouldDisplayOutOfQuotaAlert,
    selectEnforceQuotaManager,
} from './quotaManagerSelectors';
export type { WithSuiteSyncQuotaManagerState } from './quotaManagerSelectors';

/**
 * Reducers.
 */
export {
    suiteSyncQuotaManagerReducer,
    quotaManagerInitialState,
    type SuiteSyncQuotaManagerState,
} from './quotaManagerReducer';

/**
 * Constants.
 */
export { DEFAULT_DEVICE_SIZE_QUOTA } from './constants';

export { getAccountIncrementSizeQuota } from './util/getAccountIncrementSizeQuota';
