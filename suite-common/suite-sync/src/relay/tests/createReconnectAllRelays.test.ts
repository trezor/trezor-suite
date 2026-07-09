import { createMockDeps, mock } from '@suite-common/dependency-injection';
import { mockSuiteSyncStorage } from '@suite-common/suite-sync-storage/mocks';
import { type StaticSessionId } from '@trezor/connect';
import { isCodesignBuild } from '@trezor/env-utils';

import { type WithSuiteSyncState } from '../../suiteSyncSlice';
import { type ReconnectAllRelaysDeps, createReconnectAllRelays } from '../createReconnectAllRelays';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isCodesignBuild: jest.fn(),
}));

const state: WithSuiteSyncState = {
    suiteSync: {
        settings: {
            isSuiteSyncDebugEnabled: false,
            isSuiteSyncEnabled: true,
            suiteSyncRelayUrl: null,
        },
        suiteSyncErrors: {},
        suiteSyncOwners: {},
    },
};

const deviceStaticSessionId: StaticSessionId = '1@2:3';

type CreateDepsParams = {
    storageGet: ReconnectAllRelaysDeps['suiteSyncStorageRepository']['get'];
};

const createDeps = ({ storageGet }: CreateDepsParams) =>
    createMockDeps<ReconnectAllRelaysDeps>({
        getAllDeviceSessionIds: () => [deviceStaticSessionId],
        getState: () => state,
        suiteSyncStorageRepository: {
            delete: null,
            get: storageGet,
            set: null,
        },
    });

describe(createReconnectAllRelays.name, () => {
    beforeEach(() => {
        (isCodesignBuild as jest.Mock).mockReturnValue(true);
    });

    it('reconnects existing storages from clearnet to onion relay url', async () => {
        let currentRelayUrl: string | null = null;

        const updateRelayUrl = jest.fn((url: string) => {
            currentRelayUrl = url;

            return Promise.resolve();
        });

        const mockStorage = mockSuiteSyncStorage({ updateRelayUrl });

        const deps = createDeps({
            storageGet: mock(() => mockStorage),
        });

        const reconnectAllRelays = createReconnectAllRelays(deps);

        await reconnectAllRelays({ isTorEnabled: false });
        expect(deps.suiteSyncStorageRepository.get).toHaveBeenCalledWith('1');
        expect(updateRelayUrl).toHaveBeenNthCalledWith(1, 'https://suite-sync.trezor.io/evolu/');
        expect(currentRelayUrl).toBe('https://suite-sync.trezor.io/evolu/');

        await reconnectAllRelays({ isTorEnabled: true });

        expect(currentRelayUrl).toBe(
            'http://suite-sync.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion/evolu/',
        );
        expect(updateRelayUrl).toHaveBeenNthCalledWith(
            2,
            'http://suite-sync.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion/evolu/',
        );
    });

    it('skips missing storages', async () => {
        const deps = createDeps({
            storageGet: mock(() => null),
        });

        await createReconnectAllRelays(deps)({ isTorEnabled: true });

        expect(deps.suiteSyncStorageRepository.get).toHaveBeenCalledWith('1');
    });
});
