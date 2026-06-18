import { mockNotExpected } from '@suite-common/dependency-injection';
import {
    type SuiteSyncStorage,
    createSuiteSyncDeleteLocalDataError,
} from '@suite-common/suite-sync-storage';
import { err, ok } from '@trezor/type-utils';

import { createSuiteSyncStorageMock } from '../../../tests/createSuiteSyncStorageMock.mock';
import { asStorageId, createSuiteSyncStorageRepository } from '../createSuiteSyncStorageRepository';

const storageId1 = asStorageId('1');
const storage: SuiteSyncStorage = {
    data: {
        accounts: {} as any,
        addresses: {} as any,
        outputs: {} as any,
        wallets: {} as any,
    },
    deleteLocalData: jest.fn().mockResolvedValue(ok()),
    dispose: jest.fn(),
    updateRelayUrl: mockNotExpected('updateRelayUrl'),
};

describe(createSuiteSyncStorageRepository.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sets, gets and deletes the storage', async () => {
        const repository = createSuiteSyncStorageRepository();

        repository.set(storageId1, storage);
        expect(repository.get(storageId1)).toBe(storage);

        await repository.delete(storageId1);
        expect(storage.dispose).toHaveBeenCalledTimes(1);
        expect(repository.get(storageId1)).toBeNull();
    });

    it('sets the suite sync storage', () => {
        const suiteSyncStorage = createSuiteSyncStorageMock();

        const repository = createSuiteSyncStorageRepository();

        expect(repository.get(storageId1)).toBeNull();
        repository.set(storageId1, suiteSyncStorage);
        expect(repository.get(storageId1)).toBe(suiteSyncStorage);
    });

    it('deletes local data from all storages and clears them', async () => {
        const storageId2 = asStorageId('2');
        const storage2 = createSuiteSyncStorageMock({
            deleteLocalData: jest.fn().mockResolvedValue(ok()),
        });

        const repository = createSuiteSyncStorageRepository();

        repository.set(storageId1, storage);
        repository.set(storageId2, storage2);

        const result = await repository.deleteLocalData();

        expect(result).toEqual(ok());
        expect(storage.deleteLocalData).toHaveBeenCalledTimes(1);
        expect(storage2.deleteLocalData).toHaveBeenCalledTimes(1);
        expect(storage.dispose).not.toHaveBeenCalled();
        expect(repository.get(storageId1)).toBeNull();
        expect(repository.get(storageId2)).toBeNull();
    });

    it('propagates local data deletion error and keeps storages tracked', async () => {
        const deleteLocalDataError = createSuiteSyncDeleteLocalDataError(
            'Delete failed',
            new Error('Delete failed'),
        );
        const failedStorage = createSuiteSyncStorageMock({
            deleteLocalData: jest.fn().mockResolvedValue(err(deleteLocalDataError)),
        });

        const repository = createSuiteSyncStorageRepository();

        repository.set(storageId1, failedStorage);

        const result = await repository.deleteLocalData();

        expect(result).toEqual(err(deleteLocalDataError));
        expect(failedStorage.deleteLocalData).toHaveBeenCalledTimes(1);
        expect(repository.get(storageId1)).toBe(failedStorage);
    });
});
