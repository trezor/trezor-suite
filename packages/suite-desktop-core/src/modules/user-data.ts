import * as userData from '../libs/user-data';
import { ipcMain } from '../typed-electron';

import type { Module } from './index';

export const init: Module = () => {
    const { logger } = global;

    ipcMain.handle('user-data/clear', () => {
        logger.info('user-data', `Clearing user-data.`);
        return userData.clear();
    });

    ipcMain.handle('user-data/open', (_, directory = '') => {
        logger.info('user-data', `Opening user-data${directory} folder.`);
        return userData.open(directory);
    });

    return () => userData.getInfo();
};
