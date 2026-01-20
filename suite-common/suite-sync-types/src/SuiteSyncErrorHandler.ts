import { Dispatch } from '@reduxjs/toolkit';

import { SuiteSyncOwnerId } from '@suite-common/suite-types';

export type CreateSuiteSyncErrorHandlerDep = {
    dispatch: Dispatch;
};

export type RelayQuotaExceededError = { type: 'RelayQuotaExceeded'; ownerId: SuiteSyncOwnerId };
export type SuiteSyncOtherError = { type: 'RelayOther'; message: string };

export type Errors = RelayQuotaExceededError | SuiteSyncOtherError;

export type SuiteSyncErrorHandler = (error: Errors) => void;
