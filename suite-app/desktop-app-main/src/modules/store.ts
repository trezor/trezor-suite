import { ipcMain } from '../ipcMain';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'store';

export const init: ModuleInit = ({ store, logger }) => {
    ipcMain.on('store/clear', () => {
        logger.info(SERVICE_NAME, `Clearing desktop store.`);
        store.clear();
    });
};
