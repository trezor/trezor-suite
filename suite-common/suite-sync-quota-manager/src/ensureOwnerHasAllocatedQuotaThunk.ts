import { Dispatch } from '@reduxjs/toolkit';

import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/delegated-identity-key';
import { DelegatedIdentityKey, SuiteSyncOwnerId } from '@suite-common/suite-types';
import { WalletDescriptor } from '@suite-common/wallet-types';

import { prepareChallengeSession } from './challenge/prepareChallengeSession';
import { DEFAULT_OWNER_SIZE_QUOTA } from './constants';
import { quotaManagerFetchError, quotaManagerOwnerFetched } from './quotaManagerActions';
import { selectIsQuotaManagerEnabled, selectQuotaManagerBaseUrl } from './quotaManagerSelectors';
import { checkStorageByOwnerId } from './storage/checkStorage';
import { transferStorageThunk } from './storage/transferStorageThunk';
import { prepareMessageBufferEvoluAddSpaceToOwner } from './util/prepareMessageBufferEvoluAddSpaceToOwner';

const EVOLU_SIGN_ADD_SPACE_TO_OWNER_REQUEST_HEADER = 'EvoluAddSpaceToOwnerV1';

type EnsureOwnerHasAllocatedQuotaParams = {
    ownerId: SuiteSyncOwnerId;
    walletDescriptor: WalletDescriptor;
    delegatedKey: DelegatedIdentityKey;
};

export const ensureOwnerHasAllocatedQuotaThunk =
    ({ ownerId, walletDescriptor, delegatedKey }: EnsureOwnerHasAllocatedQuotaParams) =>
    async (dispatch: Dispatch, getState: () => any) => {
        const isQuotaManagerEnabled = selectIsQuotaManagerEnabled(getState());

        if (!isQuotaManagerEnabled) return;

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

            return;
        }

        if (!hasOwnerStorage.success && hasOwnerStorage.error.code !== 404) {
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

        if (!sessionChallenge.success) {
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
            appendMessageBuffer: prepareMessageBufferEvoluAddSpaceToOwner({
                publicKey: getPublicIdentityKeyFromDelegatedKey(delegatedKey),
                ownerId,
                challenge: sessionChallenge.payload.challenge,
                size: DEFAULT_OWNER_SIZE_QUOTA,
            }),
        });

        if (!proofOfDelegatedIdentity.success) {
            return;
        }

        await dispatch(
            transferStorageThunk({
                params: {
                    ownerId,
                    publicKey: getPublicIdentityKeyFromDelegatedKey(delegatedKey),
                    proof: proofOfDelegatedIdentity.payload,
                    size: DEFAULT_OWNER_SIZE_QUOTA,
                    challenge: sessionChallenge.payload.challenge,
                    sessionId: sessionChallenge.payload.sessionId,
                },
                walletDescriptor,
            }),
        );
    };
