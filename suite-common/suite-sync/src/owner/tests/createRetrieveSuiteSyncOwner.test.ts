import {
    SuiteSyncOwner,
    asDelegatedIdentityKey,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-types';
import { asDeviceUniquePath } from '@trezor/connect';
import { ok } from '@trezor/type-utils';

import {
    RetrieveSuiteSyncOwnerDeps,
    RetrieveSuiteSyncOwnerParams,
    createRetrieveSuiteSyncOwner,
} from '../createRetrieveSuiteSyncOwner';

const device: RetrieveSuiteSyncOwnerParams['device'] = {
    instance: 0,
    path: asDeviceUniquePath('path'),
    state: {
        staticSessionId: 'A@B:0',
    },
    useEmptyPassphrase: false,
};

const owner1: SuiteSyncOwner = {
    ownerId: asSuiteSyncOwnerId('owner1'),
    ownerSecret: asSuiteSyncOwnerSecretHex('owner1secretHex'),
};

const trezorConnect: RetrieveSuiteSyncOwnerDeps['trezorConnect'] = {
    evoluGetNode: () =>
        Promise.resolve({
            payload: { data: 'evoluNodeData' },
            success: true,
        }),
};

describe(createRetrieveSuiteSyncOwner.name, () => {
    it('succeeds for valid delegated key', async () => {
        const ensureSuiteSyncOwner = createRetrieveSuiteSyncOwner({
            createSuiteSyncOwner: () => ok(owner1),
            trezorConnect,
        });

        const delegatedKey = asDelegatedIdentityKey(
            '0c9d40cd155e7ddb93e7b3c7b2acd8d75e7a3ebd543a3504c8f8164fb692772b',
        );

        const result = await ensureSuiteSyncOwner({ device, delegatedKey });

        expect(result.ok).toBe(true);
        expect(result.ok && result.value).toBe(owner1);
    });

    it('fails for invalid DelegatedIdentityKey', async () => {
        const ensureSuiteSyncOwner = createRetrieveSuiteSyncOwner({
            createSuiteSyncOwner: () => ok(owner1),
            trezorConnect,
        });

        const delegatedKey = asDelegatedIdentityKey('delegated-broke-key');

        const result = await ensureSuiteSyncOwner({ device, delegatedKey });

        expect(result.ok).toBe(false);
        expect(!result.ok && result.error.type).toBe('ProofOfDelegatedSignFailed');
    });
});
