import {
    EncryptableBranded,
    EncryptedHex,
    SecureStorage,
    asEncryptedHex,
} from '@suite-common/secure-storage';
import { ok } from '@trezor/type-utils';

export const createWebauthnSecureStorage = (): SecureStorage => ({
    encrypt: <T extends EncryptableBranded>({ value }: { value: T }) =>
        // Todo: implement
        Promise.resolve(ok(asEncryptedHex(value as T))),

    decrypt: <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) =>
        // Todo: implement
        Promise.resolve(ok(value as unknown as T)),
});
