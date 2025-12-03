import {
    EncryptableBranded,
    EncryptedHex,
    EncryptionUnavailable,
    SecureStorage,
} from '@suite-common/secure-storage';
import { err } from '@trezor/type-utils';

export const createWebauthnSecureStorage = (): SecureStorage => ({
    encrypt: <T extends EncryptableBranded>(_: { value: T }) =>
        Promise.resolve(err(EncryptionUnavailable('Webauthn not implemented'))),

    decrypt: <T extends EncryptableBranded>(_: { value: EncryptedHex<T> }) =>
        Promise.resolve(err(EncryptionUnavailable('Webauthn not implemented'))),
});
