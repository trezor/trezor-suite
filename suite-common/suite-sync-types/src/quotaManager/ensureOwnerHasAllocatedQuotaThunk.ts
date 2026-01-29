import { DelegatedIdentityKey, SuiteSyncOwnerId } from '@suite-common/suite-types';
import { WalletDescriptor } from '@suite-common/wallet-types';
import { Result } from '@trezor/type-utils';

import { WriteModeRequiredForAllocationErrType } from '../refreshSuiteSyncKeys';

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
