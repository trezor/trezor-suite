import { ipcMain } from '../typed-electron';

import type { ModuleInit } from './index';

export const SERVICE_NAME = 'store';

export const init: ModuleInit = ({ store }) => {
    const { logger } = global;

    ipcMain.on('store/clear', () => {
        logger.info(SERVICE_NAME, `Clearing desktop store.`);
        store.clear();
    });
};
