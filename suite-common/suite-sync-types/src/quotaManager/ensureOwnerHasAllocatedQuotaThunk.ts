import { type SuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import { type DelegatedIdentityKey } from '@suite-common/suite-types';
import { type WalletDescriptor } from '@suite-common/wallet-types';
import { type Result } from '@trezor/type-utils';

import { type WriteModeRequiredForAllocationErrType } from './quotaManagerTypes';

export type HttpErrType = { type: 'HttpError' };

export type ChallengeFailedErrType = { type: 'ChallengeFailed' };

export type ProofOfDelegatedIdentityFailedErrType = { type: 'ProofOfDelegatedIdentityFailed' };

export type EnsureOwnerHasAllocatedQuotaParams = {
    ownerId: SuiteSyncOwnerId;
    walletDescriptor: WalletDescriptor;
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
