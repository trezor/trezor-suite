import { EncryptableBranded, asEncryptedHex } from '@suite-common/secure-storage';
import { asDelegatedIdentityKey } from '@suite-common/suite-types';
import { ok } from '@trezor/type-utils';

import { createSaveDelegatedIdentityKey } from '../saveDelegatedIdentityKey';

describe(createSaveDelegatedIdentityKey.name, () => {
    it('saves the encrypted value to the store', async () => {
        const actions: unknown[] = [];

        const saveDelegatedIdentityKey = createSaveDelegatedIdentityKey({
            dispatch: (action: unknown) => actions.push(action),
            secureStorage: {
                encrypt: <T extends EncryptableBranded>({ value }: { value: T }) =>
                    Promise.resolve(ok(asEncryptedHex<T>(`${value}-<encrypted>`))),
                decrypt: () => {
                    throw new Error('Not expected!');
                },
            },
        });

        await saveDelegatedIdentityKey({
            deviceId: 'device-123',
            delegatedIdentityKey: asDelegatedIdentityKey('delegatedKey'),
        });

        expect(actions).toStrictEqual([
            {
                payload: { delegatedKey: 'delegatedKey-<encrypted>', deviceId: 'device-123' },
                type: '@suite/device/setDelegatedIdentityKey',
            },
        ]);
    });
});
