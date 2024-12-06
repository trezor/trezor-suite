import os from 'os';

import { validateIpcMessage } from '@trezor/ipc-proxy';

import { ipcMain } from '../typed-electron';

import type { ModuleInit } from './index';

export const SERVICE_NAME = 'system-information';

export const init: ModuleInit = () => {
    ipcMain.handle('system/get-system-information', ipcEvent => {
        validateIpcMessage(ipcEvent);

        try {
            const osVersion = os.release();
            const osName = os.platform();
            const osArchitecture = os.arch();

            return { success: true, payload: { osVersion, osName, osArchitecture } };
        } catch (error) {
            return { success: false, error };
        }
    });
};
