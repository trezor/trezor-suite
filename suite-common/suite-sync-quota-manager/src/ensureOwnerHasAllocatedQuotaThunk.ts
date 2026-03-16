import { type Dispatch } from '@reduxjs/toolkit';

import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/delegated-identity-key';
import {
    type ChallengeFailedErrType,
    type EnsureOwnerHasAllocatedQuota,
    type EnsureOwnerHasAllocatedQuotaParams,
    type HttpErrType,
    type ProofOfDelegatedIdentityFailedErrType,
    type WriteModeRequiredForAllocationErrType,
} from '@suite-common/suite-sync-types';
import { err, ok } from '@trezor/type-utils';

import { prepareChallengeSession } from './challenge/prepareChallengeSession';
import {
    DEFAULT_ACCOUNT_SIZE_QUOTA,
    EVOLU_SIGN_ADD_SPACE_TO_OWNER_REQUEST_HEADER,
} from './constants';
import { quotaManagerOwnerFetched } from './quotaManagerActions';
import { selectQuotaManagerBaseUrl } from './quotaManagerSelectors';
import { checkStorageByOwnerId } from './storage/checkStorage';
import { transferStorageThunk } from './storage/transferStorageThunk';
import { prepareMessageBufferEvoluAddSpaceToOwner } from './util/prepareMessageBufferEvoluAddSpaceToOwner';

export const WriteModeRequiredForAllocation = (): WriteModeRequiredForAllocationErrType => ({
    type: 'WriteModeRequiredForAllocation',
});

export const ChallengeFailed = (): ChallengeFailedErrType => ({
    type: 'ChallengeFailed',
});

export const HttpError = (): HttpErrType => ({
    type: 'HttpError',
});

export const ProofOfDelegatedIdentityFailed = (): ProofOfDelegatedIdentityFailedErrType => ({
    type: 'ProofOfDelegatedIdentityFailed',
});

export const ensureOwnerHasAllocatedQuotaThunk =
    ({
        ownerId,
        walletDescriptor,
        delegatedKey,
        isWriteMode,
    }: EnsureOwnerHasAllocatedQuotaParams) =>
    async (dispatch: Dispatch, getState: () => any): ReturnType<EnsureOwnerHasAllocatedQuota> => {
        const quotaManagerBaseUrl = selectQuotaManagerBaseUrl(getState());

        const hasOwnerStorage = await checkStorageByOwnerId({
            baseUrl: quotaManagerBaseUrl,
            ownerId,
        });

        if (hasOwnerStorage.success) {
            dispatch(
                quotaManagerOwnerFetched({
                    walletDescriptor,
                    totalSpace: hasOwnerStorage.payload.totalSpace ?? 0,
                }),
            );

            return ok();
        }

        const isHttp404 =
            hasOwnerStorage.error.type === 'HttpError' && hasOwnerStorage.error.code === 404;

        if (!isHttp404) {
            return err(HttpError());
        }

        if (isWriteMode === false) {
            // we want to allocate on-demand
            return err(WriteModeRequiredForAllocation());
        }

        const sessionChallenge = await prepareChallengeSession({
            baseUrl: quotaManagerBaseUrl,
        });

        if (!sessionChallenge.success) {
            return err(HttpError());
        }

        const proofOfDelegatedIdentity = getProofOfDelegatedIdentity({
            delegatedKey,
            header: EVOLU_SIGN_ADD_SPACE_TO_OWNER_REQUEST_HEADER,
            appendMessageBuffer: prepareMessageBufferEvoluAddSpaceToOwner({
                publicKey: getPublicIdentityKeyFromDelegatedKey(delegatedKey),
                ownerId,
                challenge: sessionChallenge.payload.challenge,
                size: DEFAULT_ACCOUNT_SIZE_QUOTA,
            }),
        });

        if (!proofOfDelegatedIdentity.success) {
            return err(ProofOfDelegatedIdentityFailed());
        }

        await dispatch(
            transferStorageThunk({
                params: {
                    ownerId,
                    publicKey: getPublicIdentityKeyFromDelegatedKey(delegatedKey),
                    proof: proofOfDelegatedIdentity.payload,
                    size: DEFAULT_ACCOUNT_SIZE_QUOTA,
                    challenge: sessionChallenge.payload.challenge,
                    sessionId: sessionChallenge.payload.sessionId,
                },
                walletDescriptor,
            }),
        );

        return ok();
    };
