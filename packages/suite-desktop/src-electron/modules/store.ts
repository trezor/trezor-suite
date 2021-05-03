import { ipcMain } from 'electron';

const init = ({ store }: Dependencies) => {
    const { logger } = global;

    ipcMain.on('store/clear', () => {
        logger.info('store', `Clearing desktop store.`);
        store.clear();
    });
};

export default init;
