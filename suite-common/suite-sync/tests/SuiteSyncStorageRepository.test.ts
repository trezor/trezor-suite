import {
    SuiteSyncOwner,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-types';

import {
    CreateSuiteStorage,
    createSuiteSyncStorageRepositoryFactory,
} from '../src/SuiteSyncStorageRepository';

const owner: SuiteSyncOwner = {
    ownerSecret: asSuiteSyncOwnerSecretHex('Secret123'),
    ownerId: asSuiteSyncOwnerId('Owner123'),
};

describe('SuiteSyncStorageRepository', () => {
    it('fallbacks to default relay URL when not provided', () => {
        const createSuiteStorage: CreateSuiteStorage = jest.fn();

        const repository = createSuiteSyncStorageRepositoryFactory({
            createSuiteStorage,
            getRelayUrl: () => '', // <--- This is important
            defaultRelayUrl: 'http://default-relay.trezor.io',
        })();

        repository.get(owner);

        expect(createSuiteStorage).toHaveBeenCalledWith({
            relayUrl: 'http://default-relay.trezor.io',
            suiteSyncOwner: owner,
        });
    });
});
