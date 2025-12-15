import {
    type EncryptableBranded,
    type EncryptedHex,
    EncryptionUnavailable,
    type PlatformEncryption,
} from '@suite-common/platform-encryption';
import { err } from '@trezor/type-utils';

export const createWebauthnPlatformEncryption = (): PlatformEncryption => ({
    encrypt: <T extends EncryptableBranded>(_: { value: T }) =>
        Promise.resolve(err(EncryptionUnavailable('Webauthn not implemented'))),

    decrypt: <T extends EncryptableBranded>(_: { value: EncryptedHex<T> }) =>
        Promise.resolve(err(EncryptionUnavailable('Webauthn not implemented'))),
});
