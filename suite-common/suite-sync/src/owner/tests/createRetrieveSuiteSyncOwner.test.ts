import { DELEGATED_IDENTITY_KEY } from '@suite-common/delegated-identity-key-types/mocks';
import {
    SuiteSyncOwner,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-sync-storage';
import { asDelegatedIdentityKey } from '@suite-common/suite-types';
import { CancelablePromise, asDeviceUniquePath } from '@trezor/connect';
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
        CancelablePromise.resolve({
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

        const result = await ensureSuiteSyncOwner({ device, delegatedKey: DELEGATED_IDENTITY_KEY });

        expect(result.success).toBe(true);
        expect(result.success && result.payload).toBe(owner1);
    });

    it('fails for invalid DelegatedIdentityKey', async () => {
        const ensureSuiteSyncOwner = createRetrieveSuiteSyncOwner({
            createSuiteSyncOwner: () => ok(owner1),
            trezorConnect,
        });

        const delegatedKey = asDelegatedIdentityKey('delegated-broke-key');

        const result = await ensureSuiteSyncOwner({ device, delegatedKey });

        expect(result.success).toBe(false);
        expect(!result.success && result.error.type).toBe('ProofOfDelegatedSignFailed');
    });
});
