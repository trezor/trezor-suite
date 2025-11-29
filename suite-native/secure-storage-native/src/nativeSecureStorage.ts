import {
    EncryptableBranded,
    EncryptedHex,
    SecureStorage,
    asEncryptedHex,
} from '@suite-common/secure-storage';
import { ok } from '@trezor/type-utils';

export const createNativeSecureStorage = (): SecureStorage => ({
    encrypt: async <T extends EncryptableBranded>({ value }: { value: T }) =>
        // Todo: implement / figure out if we need this
        ok(asEncryptedHex(await Promise.resolve(value as T))),

    decrypt: async <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) =>
        // Todo: implement / figure out if we need this
        ok(await Promise.resolve(value as unknown as T)),
});
