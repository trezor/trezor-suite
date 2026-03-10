import { CreateSuiteStorageDep, SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import {
    RefreshSuiteSyncKeysDep,
    SuiteSyncStorageRepositoryDep,
    SuiteSyncUnavailableOnDeviceErrorType,
} from '@suite-common/suite-sync-types';
import type { WriteModeRequiredForAllocationErrType } from '@suite-common/suite-sync-types';
import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/suite-types';
import { StaticSessionId } from '@trezor/connect';
import { Result, err, ok } from '@trezor/type-utils';
import { isNotNull } from '@trezor/utils';

import { EnsureQuotaDep } from './createEnsureQuota';
import { createStorageIdFromDeviceStaticSessionId } from './createStorageIdFromDeviceStaticSessionId';
import { SuiteSyncUnavailableOnDeviceError } from '../createRefreshSuiteSyncKeys';
import { GetDeviceForStaticSessionIdDep } from '../getDeviceForStaticSessionId';

export type EnsureStorageDeps = {
    getRelayUrl: () => string;
} & SuiteSyncStorageRepositoryDep &
    CreateSuiteStorageDep &
    RefreshSuiteSyncKeysDep &
    GetDeviceForStaticSessionIdDep &
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

        const storage = deps.suiteSyncStorageRepository.get(storageId);

        if (isNotNull(storage)) {
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

        const newStorage = deps.createSuiteStorage({
            suiteSyncOwner: owner,
        });

        const quotaResult = await deps.ensureQuota({
            deviceStaticSessionId,
            delegatedKey,
            owner,
            isWriteMode,
        });

        // Set the relay URL if quota is allocated or if we are not in write mode.
        if (quotaResult.success || quotaResult.error.type === 'WriteModeRequiredForAllocation') {
            await newStorage.updateRelayUrl(deps.getRelayUrl());
        }

        deps.suiteSyncStorageRepository.set(storageId, newStorage);

        return ok(newStorage);
    };
