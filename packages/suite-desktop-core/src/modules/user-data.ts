import { ipcMain } from '../ipcMain';
import type { ModuleInit } from './module';
import * as userData from '../libs/user-data';

export const SERVICE_NAME = 'user-data';

export const init: ModuleInit = () => {
    const { logger } = global;

    ipcMain.handle('user-data/clear', () => {
        logger.info(SERVICE_NAME, `Clearing user-data.`);

        return userData.clearAppData();
    });

    ipcMain.handle('user-data/open', (_, directory = '') => {
        logger.info(SERVICE_NAME, `Opening user-data${directory} folder.`);

        return userData.open(directory);
    });

    const onLoad = () => userData.getInfo();

    return { onLoad };
};
