import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/delegated-identity-key';
import { type ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import { type SuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import {
    type QuotaManagerCommunicationFailedErrType,
    type WriteModeRequiredForAllocationErrType,
} from '@suite-common/suite-sync-types';
import { type DelegatedIdentityKey } from '@suite-common/suite-types';
import { type WalletDescriptor } from '@trezor/device-utils';
import { type Result, err, ok } from '@trezor/type-utils';

import {
    DEFAULT_DEVICE_SIZE_QUOTA,
    EVOLU_SIGN_ADD_SPACE_TO_OWNER_REQUEST_HEADER,
} from '../constants';
import { QuotaManagerCommunicationFailed, WriteModeRequiredForAllocation } from '../errors';
import { type TransferStorageFetchDep } from './createTransferStorageFetch';
import { getAccountIncrementSizeQuota } from './getAccountIncrementSizeQuota';
import { prepareMessageBufferEvoluAddSpaceToOwner } from './prepareMessageBufferEvoluAddSpaceToOwner';
import { type PrepareChallengeSessionFetchDep } from '../challenge/createPrepareChallengeSessionFetch';

type GetLeftDeviceQuota = (deviceId: string) => number | undefined;

export type AllocateOwnerQuotaParams = {
    ownerId: SuiteSyncOwnerId;
    delegatedKey: DelegatedIdentityKey;
    deviceId: string;
    walletDescriptor: WalletDescriptor;
    isWriteMode: boolean;
};

export type AllocateOwnerQuotaErr =
    | ProofOfDelegatedSignFailedType
    | WriteModeRequiredForAllocationErrType
    | QuotaManagerCommunicationFailedErrType;

export type AllocateOwnerQuota = (
    params: AllocateOwnerQuotaParams,
) => Promise<Result<void, AllocateOwnerQuotaErr>>;

export type AllocateOwnerQuotaDeps = {
    getLeftDeviceQuota: GetLeftDeviceQuota;
} & TransferStorageFetchDep &
    PrepareChallengeSessionFetchDep;

export type AllocateOwnerQuotaDep = {
    allocateOwnerQuota: AllocateOwnerQuota;
};

export const createAllocateOwnerQuota =
    (deps: AllocateOwnerQuotaDeps): AllocateOwnerQuota =>
    async ({ ownerId, delegatedKey, deviceId, walletDescriptor, isWriteMode }) => {
        if (isWriteMode === false) {
            return err(WriteModeRequiredForAllocation());
        }

        const leftDeviceQuota = deps.getLeftDeviceQuota(deviceId);
        const sizeToAllocate = getAccountIncrementSizeQuota({
            unspentStorage: leftDeviceQuota ?? DEFAULT_DEVICE_SIZE_QUOTA,
        });

        if (sizeToAllocate === 0) {
            // This is OK, user has no Quota Left and it is reflected in the Redux state,
            // so the Banner will be shown to the user. No additional handling needed here.
            return ok();
        }

        const sessionChallenge = await deps.prepareChallengeSessionFetch();

        if (!sessionChallenge.success) {
            return err(QuotaManagerCommunicationFailed(sessionChallenge.error));
        }

        const delegatedPublicKey = getPublicIdentityKeyFromDelegatedKey(delegatedKey);
        const proofOfDelegatedIdentity = getProofOfDelegatedIdentity({
            delegatedKey,
            header: EVOLU_SIGN_ADD_SPACE_TO_OWNER_REQUEST_HEADER,
            appendMessageBuffer: prepareMessageBufferEvoluAddSpaceToOwner({
                publicKey: delegatedPublicKey,
                ownerId,
                challenge: sessionChallenge.payload.challenge,
                size: sizeToAllocate,
            }),
        });

        if (!proofOfDelegatedIdentity.success) {
            return proofOfDelegatedIdentity;
        }

        const transferStorageResult = await deps.transferStorageFetch({
            params: {
                ownerId,
                publicKey: delegatedPublicKey,
                proof: proofOfDelegatedIdentity.payload,
                size: sizeToAllocate,
                challenge: sessionChallenge.payload.challenge,
                sessionId: sessionChallenge.payload.sessionId,
            },
            walletDescriptor,
            deviceId,
        });

        if (!transferStorageResult.success) {
            return err(QuotaManagerCommunicationFailed(transferStorageResult.error));
        }

        return ok();
    };
