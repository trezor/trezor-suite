import type { UnknownAction } from '@reduxjs/toolkit';

import { mockNotExpected } from '@suite-common/dependency-injection';
import { SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { StaticSessionId } from '@trezor/connect';

import { ChangeRelayUrlDeps, createChangeRelayUrl } from '../createChangeRelayUrl';

const deviceStaticSessionId: StaticSessionId = '1@2:3';

describe(createChangeRelayUrl.name, () => {
    it('changes url', () => {
        const actions: UnknownAction[] = [];

        const mockStorage: SuiteSyncStorage = {
            data: {
                accounts: {} as any,
                addresses: {} as any,
                outputs: {} as any,
                wallets: {} as any,
            },
            dispose: mockNotExpected('dispose'),
            updateRelayUrl: jest.fn(),
        };

        const deps: ChangeRelayUrlDeps = {
            getAllDeviceSessionIds: () => [deviceStaticSessionId],
            dispatch: (action: any) => actions.push(action),
            suiteSyncStorageRepository: {
                delete: mockNotExpected('delete'),
                get: jest.fn(() => mockStorage),
                set: mockNotExpected('set'),
            },
        };

        const changeRelayUrl = createChangeRelayUrl(deps);
        changeRelayUrl({ relayUrl: 'http://localhost:4000' });

        expect(actions).toStrictEqual([
            {
                payload: { url: 'http://localhost:4000' },
                type: '@suite/suite-sync/set-suite-sync-relay-url',
            },
        ]);

        expect(deps.suiteSyncStorageRepository.get).toHaveBeenCalledWith('1'); // <--- "1" is the WalletDescriptor
        expect(mockStorage.updateRelayUrl).toHaveBeenCalledWith('http://localhost:4000');
    });
});
