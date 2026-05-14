import { DELEGATED_IDENTITY_KEY } from '@suite-common/delegated-identity-key-types/mocks';
import { asSuiteSyncOwnerId, asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { asDeviceUniquePath } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import {
    type CreateEnsureSuiteSyncOwnerDeps,
    createEnsureSuiteSyncOwner,
} from '../createEnsureSuiteSyncOwner';
import { type RetrieveSuiteSyncOwnerParams } from '../createRetrieveSuiteSyncOwner';

const device: RetrieveSuiteSyncOwnerParams['device'] = {
    instance: 0,
    path: asDeviceUniquePath('path'),
    state: {
        staticSessionId: 'A@B:0',
    },
    useEmptyPassphrase: false,
};

const owner = {
    ownerId: asSuiteSyncOwnerId('owner1'),
    ownerSecret: asSuiteSyncOwnerSecretHex('owner1secretHex'),
};

const createDeps = (
    overrides: Partial<CreateEnsureSuiteSyncOwnerDeps> = {},
): CreateEnsureSuiteSyncOwnerDeps => ({
    loadSuiteSyncOwnerFromState: jest.fn().mockResolvedValue(null),
    retrieveSuiteSyncOwner: jest.fn().mockResolvedValue(ok(owner)),
    saveSuiteSyncOwner: jest.fn(),
    ...overrides,
});

describe(createEnsureSuiteSyncOwner.name, () => {
    it('returns owner from state when already loaded', async () => {
        const deps = createDeps({
            loadSuiteSyncOwnerFromState: jest.fn().mockResolvedValue(owner),
        });

        const result = await createEnsureSuiteSyncOwner(deps)({
            device,
            delegatedKey: DELEGATED_IDENTITY_KEY,
        });

        expect(result.success).toBe(true);
        expect(result.success && result.payload).toBe(owner);
        expect(deps.loadSuiteSyncOwnerFromState).toHaveBeenCalledWith({
            deviceStaticId: device.state.staticSessionId,
        });
        expect(deps.retrieveSuiteSyncOwner).not.toHaveBeenCalled();
        expect(deps.saveSuiteSyncOwner).not.toHaveBeenCalled();
    });

    it('retrieves and saves owner when not in state', async () => {
        const deps = createDeps();

        const result = await createEnsureSuiteSyncOwner(deps)({
            device,
            delegatedKey: DELEGATED_IDENTITY_KEY,
        });

        expect(result.success).toBe(true);
        expect(result.success && result.payload).toBe(owner);
        expect(deps.retrieveSuiteSyncOwner).toHaveBeenCalledWith({
            device,
            delegatedKey: DELEGATED_IDENTITY_KEY,
        });
        expect(deps.saveSuiteSyncOwner).toHaveBeenCalledWith({
            deviceStaticId: device.state.staticSessionId,
            suiteSyncOwner: owner,
        });
    });

    it('returns error when retrieve fails', async () => {
        const deviceError = err({
            type: 'DeviceError' as const,
            message: 'device disconnected',
        });
        const deps = createDeps({
            retrieveSuiteSyncOwner: jest.fn().mockResolvedValue(deviceError),
        });

        const result = await createEnsureSuiteSyncOwner(deps)({
            device,
            delegatedKey: DELEGATED_IDENTITY_KEY,
        });

        expect(result.success).toBe(false);
        expect(!result.success && result.error.type).toBe('DeviceError');
        expect(deps.saveSuiteSyncOwner).not.toHaveBeenCalled();
    });
});
