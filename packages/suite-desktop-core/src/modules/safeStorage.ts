import { safeStorage } from 'electron';

import { validateIpcMessage } from '@trezor/ipc-proxy';
import { err, ok } from '@trezor/type-utils';

import type { ModuleInit } from './module';
import { ipcMain } from '../typed-electron';

export const SERVICE_NAME = 'SAFE_STORAGE';

export const init: ModuleInit = () => {
    ipcMain.handle('safe-storage/decrypt', (ipcEvent, params) => {
        validateIpcMessage({ ipcEvent });

        if (!safeStorage.isEncryptionAvailable()) {
            return Promise.resolve(
                err({
                    type: 'EncryptionUnavailable',
                    message: 'SafeStorage encryption is not available',
                }),
            );
        }

        const buffer = Buffer.from(params.value, 'hex');
        const decrypted = safeStorage.decryptString(buffer);

        return Promise.resolve(ok(decrypted));
    });

    ipcMain.handle('safe-storage/encrypt', (ipcEvent, params) => {
        validateIpcMessage({ ipcEvent });

        if (!safeStorage.isEncryptionAvailable()) {
            return Promise.resolve(
                err({
                    type: 'EncryptionUnavailable',
                    message: 'SafeStorage encryption is not available',
                }),
            );
        }

        const encryptedHex = safeStorage.encryptString(params.value).toString('hex');

        return Promise.resolve(ok(encryptedHex));
    });
};
