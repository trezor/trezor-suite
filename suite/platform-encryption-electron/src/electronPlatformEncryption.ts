import {
    type EncryptableBranded,
    type EncryptedHex,
    type PlatformEncryption,
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

        return result.success ? ok(asEncryptedHex(result.payload as T)) : result;
    },

    decrypt: async <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) => {
        const result = await deps.desktopApi.safeStoreDecrypt({ value });

        return result.success ? ok(result.payload as T) : result;
    },
});
