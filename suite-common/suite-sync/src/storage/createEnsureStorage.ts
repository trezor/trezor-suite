import {
    type EnsureQuotaDep,
    type GetOwnerHasAllowanceDep,
} from '@suite-common/suite-sync-quota-manager';
import {
    type CreateSuiteStorageDep,
    type SuiteSyncStorage,
} from '@suite-common/suite-sync-storage';
import {
    type EnsureSuiteSyncKeysDep,
    type SuiteSyncStorageRepositoryDep,
    type SuiteSyncUnavailableOnDeviceErrorType,
    type WriteModeRequiredForAllocationErrType,
} from '@suite-common/suite-sync-types';
import { type DeviceCancelledErrType, type DeviceErrorType } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';
import { type Result, err, ok } from '@trezor/type-utils';
import { isNotNull } from '@trezor/utils';

import { createStorageIdFromDeviceStaticSessionId } from './createStorageIdFromDeviceStaticSessionId';
import { SuiteSyncUnavailableOnDeviceError } from '../createEnsureSuiteSyncKeys';
import { type GetDeviceForStaticSessionIdDep } from '../getDeviceForStaticSessionId';

export type EnsureStorageDeps = {
    getRelayUrl: () => string;
} & SuiteSyncStorageRepositoryDep &
    CreateSuiteStorageDep &
    EnsureSuiteSyncKeysDep &
    GetDeviceForStaticSessionIdDep &
    GetOwnerHasAllowanceDep &
    EnsureQuotaDep;

export type EnsureStorageParams = {
    deviceStaticSessionId: StaticSessionId;
    isWriteMode: boolean;
};

export type CreateEnsureStorage = (
    params: EnsureStorageParams,
) => Promise<
    Result<
        SuiteSyncStorage,
        | SuiteSyncUnavailableOnDeviceErrorType
        | DeviceErrorType
        | DeviceCancelledErrType
        | WriteModeRequiredForAllocationErrType
    >
>;

export type EnsureStorageDep = {
    ensureStorage: CreateEnsureStorage;
};

/**
 * Responsibility:
 * - Ensure the Suite Sync storage abstraction exists for the wallet.
 * - Orchestrate prerequisites such as keys and quota before the storage is used.
 */
export const createEnsureStorage =
    (deps: EnsureStorageDeps): CreateEnsureStorage =>
    async ({ deviceStaticSessionId, isWriteMode }): ReturnType<CreateEnsureStorage> => {
        const storageId = createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId);
        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        const existingStorage = deps.suiteSyncStorageRepository.get(storageId);

        // Return cached storage if it exists and user has owner quota.
        // We intentionally skip the isWriteMode check here because deps.ensureQuota also refreshes
        // the owner quota from QM server (we do it so other user devices can allocate more quota, thus here it would be outdated).

        if (isNotNull(existingStorage) && deps.getOwnerHasAllowance(walletDescriptor)) {
            return ok(existingStorage);
        }

        const device = deps.getDeviceForStaticSessionId(deviceStaticSessionId);

        if (device === null) {
            return err(SuiteSyncUnavailableOnDeviceError());
        }

        const keysResult = await deps.ensureSuiteSyncKeys({ device });

        if (!keysResult.success) {
            return keysResult;
        }

        const { owner, delegatedKey } = keysResult.payload;

        const storage =
            existingStorage ?? (await deps.createSuiteStorage({ suiteSyncOwner: owner }));

        // We need to call this even for isWriteMode because this also register device
        const quotaResult = await deps.ensureQuota({
            deviceStaticSessionId,
            delegatedKey,
            owner,
            isWriteMode,
        });

        // `WriteModeRequiredForAllocation` means we won't connect Storage to server,
        // but other errors are bad and need to be propagated
        if (!quotaResult.success && quotaResult.error.type !== 'WriteModeRequiredForAllocation') {
            return err(quotaResult.error);
        }

        // Only connect to the relay if quota is actually allocated.
        if (quotaResult.success) {
            await storage.updateRelayUrl(deps.getRelayUrl());
        }

        if (!isNotNull(existingStorage)) {
            deps.suiteSyncStorageRepository.set(storageId, storage);
        }

        return ok(storage);
    };
