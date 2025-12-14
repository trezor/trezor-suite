import { Dispatch } from '@reduxjs/toolkit';

import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/delegated-identity-key';
import { DelegatedIdentityKey, SuiteSyncOwnerId } from '@suite-common/suite-types';

import { prepareChallengeSession } from './challenge/prepareChallengeSession';
import { DEFAULT_OWNER_SIZE_QUOTA } from './constants';
import { quotaManagerFetchError, quotaManagerOwnerFetched } from './quotaManagerActions';
import { selectIsQuotaManagerEnabled, selectQuotaManagerBaseUrl } from './quotaManagerSelectors';
import { checkStorageByOwnerId } from './storage/checkStorage';
import { transferStorageThunk } from './storage/transferStorageThunk';
import { hashSuiteSyncOwnerId } from './util/hasSuiteSyncOwnerId';
import { prepareBufferEvoluAddSpaceToOwner } from './util/prepareBufferEvoluAddSpaceToOwner';

const EVOLU_SIGN_ADD_SPACE_TO_OWNER_REQUEST_HEADER = 'EvoluAddSpaceToOwnerV1';

type EnsureOwnerHasAllocatedQuotaParams = {
    ownerId: SuiteSyncOwnerId;
    delegatedKey: DelegatedIdentityKey;
};

export const ensureOwnerHasAllocatedQuotaThunk =
    ({ ownerId, delegatedKey }: EnsureOwnerHasAllocatedQuotaParams) =>
    async (dispatch: Dispatch, getState: () => any) => {
        const isQuotaManagerEnabled = selectIsQuotaManagerEnabled(getState());

        if (!isQuotaManagerEnabled) return;

        const quotaManagerBaseUrl = selectQuotaManagerBaseUrl(getState());

        const hasOwnerStorage = await checkStorageByOwnerId({
            baseUrl: quotaManagerBaseUrl,
            ownerId,
        });

        if (hasOwnerStorage.ok) {
            dispatch(
                quotaManagerOwnerFetched({
                    ownerIdHash: hashSuiteSyncOwnerId(ownerId),
                    totalSpace: hasOwnerStorage.value.totalSpace ?? 0,
                }),
            );

            return;
        }

        if (!hasOwnerStorage.ok && hasOwnerStorage.error.code !== 404) {
            dispatch(
                quotaManagerFetchError({
                    error: hasOwnerStorage.error.message,
                }),
            );

            return;
        }

        const sessionChallenge = await prepareChallengeSession({
            baseUrl: quotaManagerBaseUrl,
        });

        if (!sessionChallenge.ok) {
            dispatch(
                quotaManagerFetchError({
                    error: sessionChallenge.error.message,
                }),
            );

            return;
        }

        const proofOfDelegatedIdentity = getProofOfDelegatedIdentity({
            delegatedKey,
            header: EVOLU_SIGN_ADD_SPACE_TO_OWNER_REQUEST_HEADER,
            buffer: prepareBufferEvoluAddSpaceToOwner({
                publicKey: getPublicIdentityKeyFromDelegatedKey(delegatedKey),
                ownerId,
                challenge: sessionChallenge.value.challenge,
                size: DEFAULT_OWNER_SIZE_QUOTA,
            }),
        });

        if (!proofOfDelegatedIdentity.ok) {
            return;
        }

        await dispatch(
            transferStorageThunk({
                ownerId,
                publicKey: getPublicIdentityKeyFromDelegatedKey(delegatedKey),
                proof: proofOfDelegatedIdentity.value,
                size: DEFAULT_OWNER_SIZE_QUOTA,
                challenge: sessionChallenge.value.challenge,
                sessionId: sessionChallenge.value.sessionId,
            }),
        );
    };
