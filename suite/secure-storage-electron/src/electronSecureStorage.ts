import {
    EncryptableBranded,
    EncryptedHex,
    SecureStorage,
    asEncryptedHex,
} from '@suite-common/secure-storage';
import { type DesktopApi } from '@trezor/suite-desktop-api';
import { ok } from '@trezor/type-utils';

export type ElectronSecureStorageDeps = {
    desktopApi: DesktopApi;
};

export const createElectronSecureStorage = (deps: ElectronSecureStorageDeps): SecureStorage => ({
    encrypt: async <T extends EncryptableBranded>({ value }: { value: T }) => {
        const result = await deps.desktopApi.safeStoreEncrypt({ value });

        return result.ok ? ok(asEncryptedHex(result.value as T)) : result;
    },

    decrypt: async <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) => {
        const result = await deps.desktopApi.safeStoreDecrypt({ value });

        return result.ok ? ok(result.value as T) : result;
    },
});
