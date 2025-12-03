import {
    EncryptableBranded,
    EncryptedHex,
    SecureStorage,
    asEncryptedHex,
} from '@suite-common/secure-storage';
import { ok } from '@trezor/type-utils';

export const createNativeSecureStorage = (): SecureStorage => ({
    encrypt: <T extends EncryptableBranded>({ value }: { value: T }) =>
        // Todo: implement / encrypt this with Mobile Keyring.
        //       See: https://github.com/trezor/trezor-suite/issues/23282
        Promise.resolve(ok(asEncryptedHex(value as T))),

    decrypt: <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) =>
        // Todo: implement / encrypt this with Mobile Keyring.
        //       See: https://github.com/trezor/trezor-suite/issues/23282
        Promise.resolve(ok(value as unknown as T)),
});
