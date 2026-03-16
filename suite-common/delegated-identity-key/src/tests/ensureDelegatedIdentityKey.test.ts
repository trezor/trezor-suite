import { type EnsureDelegatedIdentityKeyParams } from '@suite-common/delegated-identity-key-types';
import { asDelegatedIdentityKey } from '@suite-common/suite-types';
import { asDeviceUniquePath } from '@trezor/connect';
import { ok } from '@trezor/type-utils';

import {
    type EnsureDelegatedIdentityKeyDeps,
    createEnsureDelegatedIdentityKey,
} from '../ensureDelegatedIdentityKey';

const deps: EnsureDelegatedIdentityKeyDeps = {
    loadDelegatedIdentityKeyFromState: () =>
        Promise.resolve(asDelegatedIdentityKey('redux-delegated-identity-key')),
    saveDelegatedIdentityKey: () => Promise.resolve(),
    retrieveDelegatedIdentityKeyFromDevice: () =>
        Promise.resolve(ok(asDelegatedIdentityKey('trezor-delegated-key-123'))),
};

const device: EnsureDelegatedIdentityKeyParams['device'] = {
    id: 'device-123-id',
    path: asDeviceUniquePath('1/2/3'),
    state: {
        staticSessionId: '1@2:3',
    },
};

describe(createEnsureDelegatedIdentityKey.name, () => {
    it('returns saved DelegatedIdentityKey when successfully loaded (from Redux)', async () => {
        const ensureDelegatedIdentityKey = createEnsureDelegatedIdentityKey(deps);

        const result = await ensureDelegatedIdentityKey({ device });

        expect(result.success).toBe(true);
        expect(result.success && result.payload).toBe('redux-delegated-identity-key');
    });

    it('retrieves DelegatedIdentityKey from Device whe not loaded (from Redux)', async () => {
        const ensureDelegatedIdentityKey = createEnsureDelegatedIdentityKey({
            ...deps,
            loadDelegatedIdentityKeyFromState: () => Promise.resolve(null),
        });

        const result = await ensureDelegatedIdentityKey({ device });

        expect(result.success).toBe(true);
        expect(result.success && result.payload).toBe('trezor-delegated-key-123');
    });
});
