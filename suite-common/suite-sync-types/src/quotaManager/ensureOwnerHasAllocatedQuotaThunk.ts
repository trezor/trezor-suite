import { SuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import { DelegatedIdentityKey } from '@suite-common/suite-types';
import { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

import { WriteModeRequiredForAllocationErrType } from './quotaManagerTypes';

export type HttpErrType = { type: 'HttpError' };

export type ChallengeFailedErrType = { type: 'ChallengeFailed' };

export type ProofOfDelegatedIdentityFailedErrType = { type: 'ProofOfDelegatedIdentityFailed' };

export type EnsureOwnerHasAllocatedQuotaParams = {
    ownerId: SuiteSyncOwnerId;
    deviceSessionId: StaticSessionId;
    delegatedKey: DelegatedIdentityKey;
    isWriteMode: boolean;
};

export type EnsureOwnerHasAllocatedQuota = (
    params: EnsureOwnerHasAllocatedQuotaParams,
) => Promise<
    Result<
        void,
        | WriteModeRequiredForAllocationErrType
        | HttpErrType
        | ChallengeFailedErrType
        | ProofOfDelegatedIdentityFailedErrType
    >
>;
