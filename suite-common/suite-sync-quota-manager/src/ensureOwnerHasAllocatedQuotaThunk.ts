import { Dispatch } from '@reduxjs/toolkit';

import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/delegated-identity-key';
import {
    ChallengeFailedErrType,
    EnsureOwnerHasAllocatedQuota,
    EnsureOwnerHasAllocatedQuotaParams,
    HttpErrType,
    ProofOfDelegatedIdentityFailedErrType,
    WriteModeRequiredForAllocationErrType,
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

export const ensureOwnerHasAllocatedQuotaThunk =
    ({ ownerId, deviceSessionId, delegatedKey, isWriteMode }: EnsureOwnerHasAllocatedQuotaParams) =>
    async (dispatch: Dispatch, getState: () => any): ReturnType<EnsureOwnerHasAllocatedQuota> => {
        const { walletDescriptor, deviceId } = parseDeviceStaticSessionId(deviceSessionId);
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

        const leftDeviceQuota = selectLeftDeviceQuota(getState(), deviceId);

        const sizeToAllocate = getAccountIncrementSizeQuota({
            unspendStorage: leftDeviceQuota ?? DEFAULT_DEVICE_SIZE_QUOTA,
        });

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
