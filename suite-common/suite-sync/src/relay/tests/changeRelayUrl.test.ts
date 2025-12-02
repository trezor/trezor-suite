import type { UnknownAction } from '@reduxjs/toolkit';

import { SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { asSuiteSyncOwnerId, asSuiteSyncOwnerSecretHex } from '@suite-common/suite-types';

import { mockNotExpected } from '../../../tests/utils';
import { ChangeRelayUrlDeps, createChangeRelayUrl } from '../changeRelayUrl';

const owner1 = {
    ownerId: asSuiteSyncOwnerId('OwnerId_1'),
    ownerSecret: asSuiteSyncOwnerSecretHex('OwnerSecret_2'),
};

describe(createChangeRelayUrl.name, () => {
    it('changes url', () => {
        const actions: UnknownAction[] = [];

        const mockStorage: SuiteSyncStorage = {
            accountLabels: {} as any,
            addressLabels: {} as any,
            outputLabels: {} as any,
            walletLabels: {} as any,
            dispose: mockNotExpected('dispose'),
            updateRelayUrl: jest.fn(),
        };

        const deps: ChangeRelayUrlDeps = {
            getAllDevicesOwners: () => [owner1],
            dispatch: (action: any) => actions.push(action),
            suiteSyncStorageRepository: {
                delete: mockNotExpected('delete'),
                get: jest.fn(() => mockStorage),
            },
        };

        const changeRelayUrl = createChangeRelayUrl(deps);
        changeRelayUrl({ relayUrl: 'http://localhost:4000' });

        expect(actions).toStrictEqual([
            {
                payload: { url: 'http://localhost:4000' },
                type: '@suite/suite-sync/set-local-first-storage-relay-url',
            },
        ]);

        expect(deps.suiteSyncStorageRepository.get).toHaveBeenCalledWith(owner1);
        expect(mockStorage.updateRelayUrl).toHaveBeenCalledWith('http://localhost:4000');
    });
});
