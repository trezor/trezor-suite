import {
    EncryptableBranded,
    EncryptedHex,
    SecureStorage,
    asEncryptedHex,
} from '@suite-common/secure-storage';
import { ok } from '@trezor/type-utils';

export const createWebauthnSecureStorage = (): SecureStorage => ({
    encrypt: async <T extends EncryptableBranded>({ value }: { value: T }) =>
        // Todo: implement
        ok(asEncryptedHex(await Promise.resolve(value as T))),

    decrypt: async <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) =>
        // Todo: implement
        ok(await Promise.resolve(value as unknown as T)),
});
