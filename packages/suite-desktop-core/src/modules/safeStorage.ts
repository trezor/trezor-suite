import { validateIpcMessage } from '@trezor/ipc-proxy';

import type { ModuleInit } from './module';
import { decryptFromSafeStorage, encryptToSafeStorage } from '../libs/safeStorage';
import { ipcMain } from '../typed-electron';

export const SERVICE_NAME = 'SAFE_STORAGE';

export const init: ModuleInit = () => {
    ipcMain.handle('safe-storage/decrypt', (ipcEvent, params) => {
        validateIpcMessage({ ipcEvent });

        return decryptFromSafeStorage(params.value);
    });

    ipcMain.handle('safe-storage/encrypt', (ipcEvent, params) => {
        validateIpcMessage({ ipcEvent });

        return encryptToSafeStorage(params.value);
    });
};
