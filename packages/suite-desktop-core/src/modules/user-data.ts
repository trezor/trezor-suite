import { validateIpcMessage } from '@trezor/ipc-proxy';

import * as userData from '../libs/user-data';
import { ipcMain } from '../typed-electron';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'user-data';

export const init: ModuleInit = ({ store }) => {
    const { logger } = global;

    ipcMain.handle('user-data/clear', ipcEvent => {
        validateIpcMessage({ ipcEvent });

        logger.info(SERVICE_NAME, `Clearing user-data.`);

        return userData.clear();
    });

    ipcMain.handle('user-data/open', (ipcEvent, directory = '') => {
        validateIpcMessage({ ipcEvent });

        logger.info(SERVICE_NAME, `Opening user-data${directory} folder.`);

        return userData.open(directory);
    });

    ipcMain.handle('user-data/set-anonymous-mode', (ipcEvent, enabled) => {
        validateIpcMessage({ ipcEvent });

        logger.info(SERVICE_NAME, `Setting anonymous mode to ${enabled}.`);

        return userData.setAnonymousMode({ enabled, store });
    });

    const onLoad = () => userData.getInfo();

    return { onLoad };
};
