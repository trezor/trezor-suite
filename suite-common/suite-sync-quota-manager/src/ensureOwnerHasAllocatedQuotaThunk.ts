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
    type NoQuotaLeftToAllocateErrType,
    type ProofOfDelegatedIdentityFailedErrType,
    type WriteModeRequiredForAllocationErrType,
} from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { err, ok } from '@trezor/type-utils';

import { prepareChallengeSession } from './challenge/prepareChallengeSession';
import {
    DEFAULT_DEVICE_SIZE_QUOTA,
    EVOLU_SIGN_ADD_SPACE_TO_OWNER_REQUEST_HEADER,
} from './constants';
import { quotaManagerOwnerFetched } from './quotaManagerActions';
import { selectLeftDeviceQuota, selectQuotaManagerBaseUrl } from './quotaManagerSelectors';
import { checkStorageByOwnerId } from './storage/checkStorage';
import { transferStorageThunk } from './storage/transferStorageThunk';
import { getAccountIncrementSizeQuota } from './util/getAccountIncrementSizeQuota';
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

export const NoQuotaLeftToAllocate = (): NoQuotaLeftToAllocateErrType => ({
    type: 'NoQuotaLeftToAllocate',
});

export const ensureOwnerHasAllocatedQuotaThunk =
    ({
        ownerId,
        deviceStaticSessionId,
        delegatedKey,
        isWriteMode,
    }: EnsureOwnerHasAllocatedQuotaParams) =>
    async (dispatch: Dispatch, getState: () => any): ReturnType<EnsureOwnerHasAllocatedQuota> => {
        const { walletDescriptor, deviceId } = parseDeviceStaticSessionId(deviceStaticSessionId);
        const quotaManagerBaseUrl = selectQuotaManagerBaseUrl(getState());

        const hasOwnerStorage = await checkStorageByOwnerId({
            baseUrl: quotaManagerBaseUrl,
            ownerId,
        });

        if (!hasOwnerStorage.success) {
            return err(HttpError());
        }

        // Storage exists for this owner
        if (hasOwnerStorage.payload.status === 'Allocated') {
            dispatch(
                quotaManagerOwnerFetched({
                    walletDescriptor,
                    totalSpace: hasOwnerStorage.payload.totalSpace,
                }),
            );

            return ok();
        }

        if (isWriteMode === false) {
            // we want to allocate on-demand
            return err(WriteModeRequiredForAllocation());
        }

        const leftDeviceQuota = selectLeftDeviceQuota(getState(), deviceId ?? '');
        const sizeToAllocate = getAccountIncrementSizeQuota({
            unspentStorage: leftDeviceQuota ?? DEFAULT_DEVICE_SIZE_QUOTA,
        });

        if (sizeToAllocate === 0) {
            return err(NoQuotaLeftToAllocate());
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
                size: sizeToAllocate,
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
                    size: sizeToAllocate,
                    challenge: sessionChallenge.payload.challenge,
                    sessionId: sessionChallenge.payload.sessionId,
                },
                walletDescriptor,
                deviceId,
            }),
        );

        return ok();
    };
