import {
    type DecryptParams,
    DecryptionFailed,
    type EncryptableBranded,
    EncryptionLocked,
    EncryptionUnavailable,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { err, ok } from '@trezor/type-utils';

import { createLoadDelegatedIdentityKeyFromState } from './loadDelegatedIdentityKeyFromState';

describe(createLoadDelegatedIdentityKeyFromState.name, () => {
    it('gets the encrypted key', async () => {
        const getDelegatedIdentityKey = createLoadDelegatedIdentityKeyFromState({
            dispatch: action => action,
            getDeviceDelegatedIdentityKey: () => asEncryptedHex('delegated-key-<encrypted>'),
            platformEncryption: {
                encrypt: () => {
                    throw new Error('Not expected!');
                },
                decrypt: <T extends EncryptableBranded>({ value }: DecryptParams<T>) =>
                    Promise.resolve(ok(value.replace('<encrypted>', '') as T)),
            },
        });

        const result = await getDelegatedIdentityKey({ deviceId: 'device-id-123' });

        expect(result).toBe('delegated-key-');
    });

    it.each([
        [
            'returns null, when key is there but decryption fails',
            EncryptionUnavailable('encryption unavailable'),
        ],
        ['returns null, when key is there but decryption fails', DecryptionFailed()],
    ])('%s', async (_, error) => {
        const getDelegatedIdentityKey = createLoadDelegatedIdentityKeyFromState({
            dispatch: action => action,
            getDeviceDelegatedIdentityKey: () => asEncryptedHex('delegated-key-<encrypted>'),
            platformEncryption: {
                encrypt: () => {
                    throw new Error('Not expected!');
                },
                decrypt: <T extends EncryptableBranded>(_: DecryptParams<T>) =>
                    Promise.resolve(err(error)),
            },
        });

        const result = await getDelegatedIdentityKey({ deviceId: 'device-id-123' });

        expect(result).toBe(null);
    });

    it('returns null and keeps the stored key while the encryption is locked', async () => {
        const dispatch = jest.fn();
        const getDelegatedIdentityKey = createLoadDelegatedIdentityKeyFromState({
            dispatch,
            getDeviceDelegatedIdentityKey: () => asEncryptedHex('delegated-key-<encrypted>'),
            platformEncryption: {
                encrypt: () => {
                    throw new Error('Not expected!');
                },
                decrypt: <T extends EncryptableBranded>(_: DecryptParams<T>) =>
                    Promise.resolve(err(EncryptionLocked('locked'))),
            },
        });

        const result = await getDelegatedIdentityKey({ deviceId: 'device-id-123' });

        expect(result).toBe(null);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('binds the decryption to the device', async () => {
        const decryptParams: DecryptParams<EncryptableBranded>[] = [];
        const getDelegatedIdentityKey = createLoadDelegatedIdentityKeyFromState({
            dispatch: action => action,
            getDeviceDelegatedIdentityKey: () => asEncryptedHex('delegated-key'),
            platformEncryption: {
                encrypt: () => {
                    throw new Error('Not expected!');
                },
                decrypt: <T extends EncryptableBranded>(params: DecryptParams<T>) => {
                    decryptParams.push(params);

                    return Promise.resolve(ok(params.value as unknown as T));
                },
            },
        });

        await getDelegatedIdentityKey({ deviceId: 'device-id-123' });

        expect(decryptParams).toEqual([
            {
                value: 'delegated-key',
                context: 'delegated-identity-key:device-id-123',
            },
        ]);
    });
});
