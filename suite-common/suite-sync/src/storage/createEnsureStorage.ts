import {
    type EnsureQuotaDep,
    type GetOwnerHasAllowanceDep,
} from '@suite-common/suite-sync-quota-manager';
import {
    type CreateSuiteStorageDep,
    type SuiteSyncStorage,
} from '@suite-common/suite-sync-storage';
import {
    type RefreshSuiteSyncKeysDep,
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
import { SuiteSyncUnavailableOnDeviceError } from '../createRefreshSuiteSyncKeys';
import { type GetDeviceForStaticSessionIdDep } from '../getDeviceForStaticSessionId';

export type EnsureStorageDeps = {
    getRelayUrl: () => string;
} & SuiteSyncStorageRepositoryDep &
    CreateSuiteStorageDep &
    RefreshSuiteSyncKeysDep &
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

export const createEnsureStorage =
    (deps: EnsureStorageDeps): CreateEnsureStorage =>
    async ({ deviceStaticSessionId, isWriteMode }): ReturnType<CreateEnsureStorage> => {
        const storageId = createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId);
        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        const storage = deps.suiteSyncStorageRepository.get(storageId);

        // Return cached storage if it exists and user has owner quota.
        // We intentionally skip the isWriteMode check here because deps.ensureQuota also refreshes
        // the owner quota from QM server (we do it so other user devices can allocate more quota, thus here it would be outdated).

        if (isNotNull(storage) && deps.getOwnerHasAllowance(walletDescriptor)) {
            return ok(storage);
        }

        const device = deps.getDeviceForStaticSessionId(deviceStaticSessionId);

        if (device === null) {
            return err(SuiteSyncUnavailableOnDeviceError());
        }

        const keysResult = await deps.refreshSuiteSyncKeys({ device });

        if (!keysResult.success) {
            return keysResult;
        }

        const { owner, delegatedKey } = keysResult.payload;

        const quotaResult = await deps.ensureQuota({
            deviceStaticSessionId,
            delegatedKey,
            owner,
            isWriteMode,
        });

        // correct approach would be to create a new storage anyway, but currently there is bug regarding the dispose function
        const resolvedStorage =
            storage ?? (await deps.createSuiteStorage({ suiteSyncOwner: owner }));

        // Set the server URL if quota is allocated or if storage was not yet initialized.
        if (quotaResult.success || quotaResult.error.type === 'WriteModeRequiredForAllocation') {
            await resolvedStorage.updateRelayUrl(deps.getRelayUrl());
        }

        if (!isNotNull(storage)) {
            deps.suiteSyncStorageRepository.set(storageId, resolvedStorage);
        }

        return ok(resolvedStorage);
    };
