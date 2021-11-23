import * as userData from '@desktop-electron/libs/user-data';

import { ipcMain } from 'electron';

const init = () => {
    const { logger } = global;

    ipcMain.handle('user-data/get-info', () => {
        logger.info('user-data', `Gathering user-data info.`);
        return userData.getInfo();
    });

    ipcMain.handle('user-data/clear', () => {
        logger.info('user-data', `Clearing user-data.`);
        return userData.clear();
    });
};

export default init;
