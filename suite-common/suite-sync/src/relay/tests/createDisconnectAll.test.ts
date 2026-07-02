import { createMockDeps, mock, mockNotExpected } from '@suite-common/dependency-injection';
import { mockSuiteSyncStorage } from '@suite-common/suite-sync-storage/mocks';
import { type StaticSessionId } from '@trezor/connect';

import { type DisconnectAllDeps, createDisconnectAll } from '../createDisconnectAll';

const deviceStaticSessionId: StaticSessionId = '1@2:3';

type CreateDepsParams = {
    storageGet: DisconnectAllDeps['suiteSyncStorageRepository']['get'];
};

const createDeps = ({ storageGet }: CreateDepsParams) =>
    createMockDeps<DisconnectAllDeps>({
        getAllDeviceSessionIds: () => [deviceStaticSessionId],
        suiteSyncStorageRepository: {
            delete: null,
            get: storageGet,
            set: null,
        },
    });

describe(createDisconnectAll.name, () => {
    it('disconnects existing storages', async () => {
        const disconnectRelay = jest.fn(() => Promise.resolve());
        const mockStorage = mockSuiteSyncStorage({
            disconnectRelay,
            updateRelayUrl: mockNotExpected('updateRelayUrl'),
        });

        const deps = createDeps({
            storageGet: mock(() => mockStorage),
        });

        await createDisconnectAll(deps)();

        expect(deps.suiteSyncStorageRepository.get).toHaveBeenCalledWith('1');
        expect(disconnectRelay).toHaveBeenCalledTimes(1);
    });

    it('skips missing storages', async () => {
        const deps = createDeps({
            storageGet: mock(() => null),
        });

        await createDisconnectAll(deps)();

        expect(deps.suiteSyncStorageRepository.get).toHaveBeenCalledWith('1');
    });
});
