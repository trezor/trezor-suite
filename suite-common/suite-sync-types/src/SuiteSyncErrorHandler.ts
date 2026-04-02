import { type SuiteSyncOwnerId } from '@suite-common/suite-sync-storage';

export type RelayQuotaExceededError = { type: 'RelayQuotaExceeded'; ownerId: SuiteSyncOwnerId };
export type SuiteSyncOtherError = { type: 'RelayOther'; message: string };

export type Errors = RelayQuotaExceededError | SuiteSyncOtherError;

/**
 * This error handler in a API between SuiteSync and the Storage layer-
 * For example the `createEvoluErrorHandler` maps the Evolu Errors
 * onto SuiteSync Errors.
 */
export type SuiteSyncInternalErrorHandler = (error: Errors) => Promise<void>;
