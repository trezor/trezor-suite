import { ipcMain } from '../typed-electron';

import { Module } from './index';

export const init: Module = ({ store }) => {
    const { logger } = global;

    ipcMain.on('store/clear', () => {
        logger.info('store', `Clearing desktop store.`);
        store.clear();
    });
};
