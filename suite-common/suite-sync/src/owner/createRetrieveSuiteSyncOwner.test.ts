import { DELEGATED_IDENTITY_KEY } from '@suite-common/delegated-identity-key-types/mocks';
import {
    type SuiteSyncOwner,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-sync-storage';
import { asDelegatedIdentityKey } from '@suite-common/suite-types';
import { asDeviceUniquePath } from '@trezor/connect';
import { type GetTrezorConnect } from '@trezor/connect-common';
import { ok } from '@trezor/type-utils';

import {
    type RetrieveSuiteSyncOwnerParams,
    createRetrieveSuiteSyncOwner,
} from './createRetrieveSuiteSyncOwner';

const device: RetrieveSuiteSyncOwnerParams['device'] = {
    instance: 0,
    path: asDeviceUniquePath('path'),
    state: {
        staticSessionId: 'A@B:0',
    },
    useEmptyPassphrase: false,
    connected: true,
};

const owner1: SuiteSyncOwner = {
    ownerId: asSuiteSyncOwnerId('owner1'),
    ownerSecret: asSuiteSyncOwnerSecretHex('owner1secretHex'),
};

const mockGetTrezorConnect: GetTrezorConnect<'evoluGetNode'> = () => ({
    evoluGetNode: () =>
        Promise.resolve({
            payload: { data: 'evoluNodeData' },
            success: true,
        }),
});

describe(createRetrieveSuiteSyncOwner.name, () => {
    it('succeeds for valid delegated key', async () => {
        const ensureSuiteSyncOwner = createRetrieveSuiteSyncOwner({
            createSuiteSyncOwner: () => ok(owner1),
            getTrezorConnect: mockGetTrezorConnect,
        });

        const result = await ensureSuiteSyncOwner({ device, delegatedKey: DELEGATED_IDENTITY_KEY });

        expect(result.success).toBe(true);
        expect(result.success && result.payload).toBe(owner1);
    });

    it('fails for invalid DelegatedIdentityKey', async () => {
        const ensureSuiteSyncOwner = createRetrieveSuiteSyncOwner({
            createSuiteSyncOwner: () => ok(owner1),
            getTrezorConnect: mockGetTrezorConnect,
        });

        const delegatedKey = asDelegatedIdentityKey('delegated-broke-key');

        const result = await ensureSuiteSyncOwner({ device, delegatedKey });

        expect(result.success).toBe(false);
        expect(!result.success && result.error.type).toBe('ProofOfDelegatedSignFailed');
    });

    it('returns DeviceNotConnectedError without calling Connect when device is not connected', async () => {
        const getTrezorConnect = jest.fn();
        const ensureSuiteSyncOwner = createRetrieveSuiteSyncOwner({
            createSuiteSyncOwner: () => ok(owner1),
            getTrezorConnect,
        });

        const result = await ensureSuiteSyncOwner({
            device: { ...device, connected: false },
            delegatedKey: DELEGATED_IDENTITY_KEY,
        });

        expect(result.success).toBe(false);
        expect(!result.success && result.error.type).toBe('DeviceNotConnectedError');
        expect(getTrezorConnect).not.toHaveBeenCalled();
    });
});
