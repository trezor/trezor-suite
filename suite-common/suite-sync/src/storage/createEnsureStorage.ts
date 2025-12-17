import { CreateSuiteStorageDep, SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import {
    RefreshSuiteKeysUnavailableType,
    RefreshSuiteSyncKeysDep,
    SuiteSyncStorageRepositoryDep,
} from '@suite-common/suite-sync-types';
import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { Result, err, ok } from '@trezor/type-utils';

import { createStorageIdFromDeviceStaticSessionId } from './createStorageIdFromDeviceStaticSessionId';
import { RefreshSuiteKeysUnavailable } from '../createRefreshSuiteSyncKeys';
import { GetDeviceForStaticSessionIdDep } from '../getDeviceForStaticSessionId';

export type EnsureStorageDeps = {
    defaultRelayUrl: string;
    getRelayUrl: () => string | null;
} & SuiteSyncStorageRepositoryDep &
    CreateSuiteStorageDep &
    RefreshSuiteSyncKeysDep &
    GetDeviceForStaticSessionIdDep;

export type EnsureStorageParams = {
    deviceStaticSessionId: StaticSessionId;
};

export type CreateEnsureStorage = (
    params: EnsureStorageParams,
) => Promise<
    Result<
        SuiteSyncStorage,
        RefreshSuiteKeysUnavailableType | DeviceErrorType | DeviceCancelledErrType
    >
>;

export type EnsureStorageDep = {
    ensureStorage: CreateEnsureStorage;
};

export const createEnsureStorage =
    (deps: EnsureStorageDeps): CreateEnsureStorage =>
    async ({ deviceStaticSessionId }): ReturnType<CreateEnsureStorage> => {
        const storageId = createStorageIdFromDeviceStaticSessionId(deviceStaticSessionId);

        const storage = deps.suiteSyncStorageRepository.get(storageId);

        if (storage !== null) {
            return ok(storage);
        }

        const device = deps.getDeviceForStaticSessionId(deviceStaticSessionId);

        if (device === null) {
            return err(RefreshSuiteKeysUnavailable());
        }

        const ownerResult = await deps.refreshSuiteSyncKeys({ device });

        if (!ownerResult.ok) {
            return ownerResult;
        }

        const relayUrl = deps.getRelayUrl();
        const newStorage = deps.createSuiteStorage({
            suiteSyncOwner: ownerResult.value,
            relayUrl: relayUrl !== null && relayUrl.trim() !== '' ? relayUrl : deps.defaultRelayUrl,
        });

        deps.suiteSyncStorageRepository.set(storageId, newStorage);

        return ok(newStorage);
    };
