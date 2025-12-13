import { SuiteSyncStorage } from '@suite-common/suite-sync-storage';

import { mockNotExpected } from '../../../tests/utils';
import { asStorageId, createSuiteSyncStorageRepository } from '../suiteSyncStorageRepository';

const storageId1 = asStorageId('1');
const storage: SuiteSyncStorage = {
    accountLabels: {} as any,
    addressLabels: {} as any,
    outputLabels: {} as any,
    walletLabels: {} as any,
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
});
