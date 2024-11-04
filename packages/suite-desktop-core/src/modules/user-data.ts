import { validateIpcMessage } from '@trezor/ipc-proxy';

import * as userData from '../libs/user-data';
import { ipcMain } from '../typed-electron';

import type { ModuleInit } from './index';

export const SERVICE_NAME = 'user-data';

export const init: ModuleInit = () => {
    const { logger } = global;

    ipcMain.handle('user-data/clear', ipcEvent => {
        validateIpcMessage(ipcEvent);

        logger.info(SERVICE_NAME, `Clearing user-data.`);

        return userData.clear();
    });

    ipcMain.handle('user-data/open', (ipcEvent, directory = '') => {
        validateIpcMessage(ipcEvent);

        logger.info(SERVICE_NAME, `Opening user-data${directory} folder.`);

        return userData.open(directory);
    });

    const onLoad = () => userData.getInfo();

    return { onLoad };
};
