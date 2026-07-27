import { mockNotExpected } from '@suite-common/dependency-injection';
import { mockSuiteSyncStorage } from '@suite-common/suite-sync-storage/mocks';

import { asStorageId, createSuiteSyncStorageRepository } from './createSuiteSyncStorageRepository';
import { createSuiteSyncStorageMock } from '../../mocks/mockCreateSuiteSyncStorage';

const storageId1 = asStorageId('1');
const storage = mockSuiteSyncStorage({
    dispose: jest.fn(),
    updateRelayUrl: mockNotExpected('updateRelayUrl'),
});

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
