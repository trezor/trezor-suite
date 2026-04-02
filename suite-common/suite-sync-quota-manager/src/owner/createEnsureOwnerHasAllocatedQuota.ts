import { type Dispatch } from '@reduxjs/toolkit';

import { type ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import { type SuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import {
    type QuotaManagerCommunicationFailedErrType,
    type WriteModeRequiredForAllocationErrType,
} from '@suite-common/suite-sync-types';
import { type DelegatedIdentityKey } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';
import { type Result, err, exhaustive, ok } from '@trezor/type-utils';

import { type AllocateOwnerQuotaDep } from './createAllocateOwnerQuota';
import { QuotaManagerCommunicationFailed } from '../errors';
import { quotaManagerOwnerFetched } from '../quotaManagerActions';
import { type CheckStorageByOwnerIdFetchDep } from './createCheckStorageByOwnerIdFetch';

export type EnsureOwnerHasAllocatedQuotaParams = {
    ownerId: SuiteSyncOwnerId;
    deviceStaticSessionId: StaticSessionId;
    delegatedKey: DelegatedIdentityKey;
    isWriteMode: boolean;
};

export type EnsureOwnerHasAllocatedQuota = (
    params: EnsureOwnerHasAllocatedQuotaParams,
) => Promise<
    Result<
        void,
        | ProofOfDelegatedSignFailedType
        | WriteModeRequiredForAllocationErrType
        | QuotaManagerCommunicationFailedErrType
    >
>;

export type EnsureOwnerHasAllocatedQuotaDeps = {
    dispatch: Dispatch;
} & CheckStorageByOwnerIdFetchDep &
    AllocateOwnerQuotaDep;

export type EnsureOwnerHasAllocatedQuotaDep = {
    ensureOwnerHasAllocatedQuota: EnsureOwnerHasAllocatedQuota;
};

export const createEnsureOwnerHasAllocatedQuota =
    (deps: EnsureOwnerHasAllocatedQuotaDeps): EnsureOwnerHasAllocatedQuota =>
    async ({ ownerId, deviceStaticSessionId, delegatedKey, isWriteMode }) => {
        const { walletDescriptor, deviceId } = parseDeviceStaticSessionId(deviceStaticSessionId);

        const hasOwnerStorage = await deps.checkStorageByOwnerIdFetch({ ownerId });

        if (!hasOwnerStorage.success) {
            return err(QuotaManagerCommunicationFailed(hasOwnerStorage.error));
        }

        const { status } = hasOwnerStorage.payload;

        switch (status) {
            case 'Allocated': {
                deps.dispatch(
                    quotaManagerOwnerFetched({
                        walletDescriptor,
                        totalSpace: hasOwnerStorage.payload.totalSpace,
                    }),
                );

                return ok();
            }

            case 'NoQuota': {
                return deps.allocateOwnerQuota({
                    ownerId,
                    delegatedKey,
                    deviceId,
                    walletDescriptor,
                    isWriteMode,
                });
            }

            default:
                return exhaustive(status);
        }
    };
