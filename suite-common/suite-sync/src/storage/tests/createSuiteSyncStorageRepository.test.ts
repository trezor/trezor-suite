import { mockNotExpected } from '@suite-common/dependency-injection';
import { type SuiteSyncStorage } from '@suite-common/suite-sync-storage';

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
    dispose: jest.fn(),
    updateRelayUrl: mockNotExpected('updateRelayUrl'),
};

describe(createSuiteSyncStorageRepository.name, () => {
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
});
