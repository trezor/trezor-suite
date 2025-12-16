import {
    EncryptableBranded,
    EncryptedHex,
    PlatformEncryption,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { EnsureMMKVKeyDep } from '@suite-native/storage';
import { ok } from '@trezor/type-utils';

type NativePlatformEncryptionDeps = EnsureMMKVKeyDep;

export const createNativePlatformEncryption = (
    deps: NativePlatformEncryptionDeps,
): PlatformEncryption => ({
    encrypt: async <T extends EncryptableBranded>({ value }: { value: T }) => {
        const key = await deps.ensureMMKVKey();
        console.log('___Do some ENCRYPT MAGIC with KEY', key);

        return ok(asEncryptedHex(value as T));
    },

    decrypt: async <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) => {
        const key = await deps.ensureMMKVKey();
        console.log('___Do some DECRYPT MAGIC with KEY', key);

        return Promise.resolve(ok(value as unknown as T));
    },
});
