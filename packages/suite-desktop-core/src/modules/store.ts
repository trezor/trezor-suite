import { ipcMain } from '../typed-electron';

import type { Module } from './index';

export const SERVICE_NAME = 'store';

export const init: Module = ({ store }) => {
    const { logger } = global;

    ipcMain.on('store/clear', () => {
        logger.info(SERVICE_NAME, `Clearing desktop store.`);
        store.clear();
    });
};
