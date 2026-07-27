import {
    DecryptionFailed,
    type EncryptableBranded,
    type EncryptedHex,
    EncryptionUnavailable,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { err, ok } from '@trezor/type-utils';

import { createLoadDelegatedIdentityKeyFromState } from '../loadDelegatedIdentityKeyFromState';

describe(createLoadDelegatedIdentityKeyFromState.name, () => {
    it('gets the encrypted key', async () => {
        const getDelegatedIdentityKey = createLoadDelegatedIdentityKeyFromState({
            dispatch: () => {},
            getDeviceDelegatedIdentityKey: () => asEncryptedHex('delegated-key-<encrypted>'),
            platformEncryption: {
                encrypt: () => {
                    throw new Error('Not expected!');
                },
                decrypt: <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) =>
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
            dispatch: () => {},
            getDeviceDelegatedIdentityKey: () => asEncryptedHex('delegated-key-<encrypted>'),
            platformEncryption: {
                encrypt: () => {
                    throw new Error('Not expected!');
                },
                decrypt: <T extends EncryptableBranded>(_: { value: EncryptedHex<T> }) =>
                    Promise.resolve(err(error)),
            },
        });

        const result = await getDelegatedIdentityKey({ deviceId: 'device-id-123' });

        expect(result).toBe(null);
    });
});
