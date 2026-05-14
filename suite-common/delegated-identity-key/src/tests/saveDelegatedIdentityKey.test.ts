import type { UnknownAction } from '@reduxjs/toolkit';

import { type EncryptableBranded, asEncryptedHex } from '@suite-common/platform-encryption';
import { asDelegatedIdentityKey } from '@suite-common/suite-types';
import { ok } from '@trezor/type-utils';

import { createSaveDelegatedIdentityKey } from '../saveDelegatedIdentityKey';

describe(createSaveDelegatedIdentityKey.name, () => {
    it('saves the encrypted value to the store', async () => {
        const actions: UnknownAction[] = [];

        const saveDelegatedIdentityKey = createSaveDelegatedIdentityKey({
            dispatch: (action: any) => actions.push(action),
            platformEncryption: {
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
