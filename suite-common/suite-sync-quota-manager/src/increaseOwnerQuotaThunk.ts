import { type Dispatch } from '@reduxjs/toolkit';

import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/delegated-identity-key';
import { isTrezorDeviceWithState, selectSelectedDevice } from '@suite-common/device';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { type SuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import { asDelegatedIdentityKey } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import { prepareChallengeSession } from './challenge/prepareChallengeSession';
import {
    DEFAULT_DEVICE_SIZE_QUOTA,
    EVOLU_SIGN_ADD_SPACE_TO_OWNER_REQUEST_HEADER,
} from './constants';
import { selectLeftDeviceQuota, selectQuotaManagerBaseUrl } from './quotaManagerSelectors';
import { transferStorageThunk } from './storage/transferStorageThunk';
import { getAccountIncrementSizeQuota } from './util/getAccountIncrementSizeQuota';
import { prepareMessageBufferEvoluAddSpaceToOwner } from './util/prepareMessageBufferEvoluAddSpaceToOwner';

type AllocateMoreOwnerQuotaParams = {
    ownerId: SuiteSyncOwnerId;
};

export const increaseOwnerQuotaThunk =
    ({ ownerId }: AllocateMoreOwnerQuotaParams) =>
    async (dispatch: Dispatch, getState: () => any, extra: ExtraDependencies) => {
        const device = selectSelectedDevice(getState());

        if (!device || !isTrezorDeviceWithState(device)) {
            return;
        }
        const { walletDescriptor } = parseDeviceStaticSessionId(device.state.staticSessionId);
        const quotaManagerBaseUrl = selectQuotaManagerBaseUrl(getState());

        const leftDeviceQuota = selectLeftDeviceQuota(getState(), device.id);

        const sizeToAllocate = getAccountIncrementSizeQuota({
            unspentStorage: leftDeviceQuota ?? DEFAULT_DEVICE_SIZE_QUOTA,
        });
        if (sizeToAllocate === 0) {
            return;
        }

        const delegatedKey = await extra.services.ensureDelegatedIdentityKey({ device });
        if (!delegatedKey.success) {
            return;
        }

        const delegatedPublicKey = getPublicIdentityKeyFromDelegatedKey(delegatedKey.payload);

        const sessionChallenge = await prepareChallengeSession({
            baseUrl: quotaManagerBaseUrl,
        });

        if (!sessionChallenge.success) {
            return;
        }

        const proof = getProofOfDelegatedIdentity({
            delegatedKey: asDelegatedIdentityKey(delegatedKey.payload),
            header: EVOLU_SIGN_ADD_SPACE_TO_OWNER_REQUEST_HEADER,
            appendMessageBuffer: prepareMessageBufferEvoluAddSpaceToOwner({
                ownerId,
                challenge: sessionChallenge.payload.challenge,
                size: sizeToAllocate,
                publicKey: delegatedPublicKey,
            }),
        });

        if (!proof.success) {
            return;
        }

        dispatch(
            transferStorageThunk({
                deviceId: device.id,
                walletDescriptor,
                params: {
                    ownerId,
                    size: sizeToAllocate,
                    proof: proof.payload,
                    sessionId: sessionChallenge.payload.sessionId,
                    challenge: sessionChallenge.payload.challenge,
                    publicKey: delegatedPublicKey,
                },
            }),
        );
    };
