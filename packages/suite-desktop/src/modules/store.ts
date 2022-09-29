import { ipcMain } from '../typed-electron';
import { Module } from './index';

const init: Module = ({ store }) => {
    const { logger } = global;

    ipcMain.on('store/clear', () => {
        logger.info('store', `Clearing desktop store.`);
        store.clear();
    });
};

export default init;
