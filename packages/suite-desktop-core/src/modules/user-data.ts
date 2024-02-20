import * as userData from '../libs/user-data';
import { ipcMain } from '../typed-electron';

import type { Module } from './index';

export const SERVICE_NAME = 'user-data';

export const init: Module = () => {
    const { logger } = global;

    ipcMain.handle('user-data/clear', () => {
        logger.info(SERVICE_NAME, `Clearing user-data.`);

        return userData.clear();
    });

    ipcMain.handle('user-data/open', (_, directory = '') => {
        logger.info(SERVICE_NAME, `Opening user-data${directory} folder.`);

        return userData.open(directory);
    });

    return () => userData.getInfo();
};
