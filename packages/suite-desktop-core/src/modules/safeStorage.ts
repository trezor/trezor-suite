import { safeStorage } from 'electron';

import { DecryptionFailed, EncryptionUnavailable } from '@suite-common/platform-encryption';
import { isLinux } from '@trezor/env-utils';
import { validateIpcMessage } from '@trezor/ipc-proxy';
import { err, ok } from '@trezor/type-utils';

import type { ModuleInit } from './module';
import { ipcMain } from '../typed-electron';

export const SERVICE_NAME = 'SAFE_STORAGE';

const isEncryptionAvailable = () => {
    if (!safeStorage.isEncryptionAvailable()) {
        return err(EncryptionUnavailable('SafeStorage encryption is not available'));
    }

    // NOTE: this method is NOT available on mac / windows, it is linux only
    if (!('getSelectedStorageBackend' in safeStorage)) {
        if (isLinux()) {
            return err(
                EncryptionUnavailable(
                    'SafeStorage#getSelectedStorageBackend is not available on Linux',
                ),
            );
        }

        return ok();
    }

    // This is probably covered by `isEncryptionAvailable()`, but just to be sure!
    // It is possible to allow `basic_text` by bad configuration
    if (safeStorage.getSelectedStorageBackend() === 'basic_text') {
        return err(EncryptionUnavailable('Storage Backend is "basic_text", not secure'));
    }

    return ok();
};

export const init: ModuleInit = () => {
    ipcMain.handle('safe-storage/decrypt', (ipcEvent, params) => {
        validateIpcMessage({ ipcEvent });

        const isEncryptionAvailableResult = isEncryptionAvailable();
        if (!isEncryptionAvailableResult.success) {
            return isEncryptionAvailableResult;
        }

        try {
            const buffer = Buffer.from(params.value, 'hex');
            const decrypted = safeStorage.decryptString(buffer);

            return Promise.resolve(ok(decrypted));
        } catch {
            return Promise.resolve(err(DecryptionFailed()));
        }
    });

    ipcMain.handle('safe-storage/encrypt', (ipcEvent, params) => {
        validateIpcMessage({ ipcEvent });

        const isEncryptionAvailableResult = isEncryptionAvailable();
        if (!isEncryptionAvailableResult.success) {
            return isEncryptionAvailableResult;
        }

        const encryptedHex = safeStorage.encryptString(params.value).toString('hex');

        return Promise.resolve(ok(encryptedHex));
    });
};
