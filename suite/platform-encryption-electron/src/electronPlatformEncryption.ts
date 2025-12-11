import {
    EncryptableBranded,
    EncryptedHex,
    PlatformEncryption,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { type DesktopApi } from '@trezor/suite-desktop-api';
import { ok } from '@trezor/type-utils';

export type ElectronPlatformEncryptionDeps = {
    desktopApi: DesktopApi;
};

export const createElectronPlatformEncryption = (
    deps: ElectronPlatformEncryptionDeps,
): PlatformEncryption => ({
    encrypt: async <T extends EncryptableBranded>({ value }: { value: T }) => {
        const result = await deps.desktopApi.safeStoreEncrypt({ value });

        return result.ok ? ok(asEncryptedHex(result.value as T)) : result;
    },

    decrypt: async <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) => {
        const result = await deps.desktopApi.safeStoreDecrypt({ value });

        return result.ok ? ok(result.value as T) : result;
    },
});
