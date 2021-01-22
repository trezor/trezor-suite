/**
 * Metadata feature (save/load metadata locally)
 */
import { ipcMain } from 'electron';
import { save, read } from '@desktop-electron/libs/user-data';

const DATA_DIR = '/metadata';

export const init = () => {
    const { logger } = global;

    ipcMain.handle('metadata/write', async (_, message) => {
        logger.info('metadata', `Writing metadata to ${DATA_DIR}/${message.file}`);
        const resp = await save(DATA_DIR, message.file, message.content);
        return resp;
    });

    ipcMain.handle('metadata/read', async (_, message) => {
        logger.info('metadata', `Reading metadata from ${DATA_DIR}/${message.file}`);
        const resp = await read(DATA_DIR, message.file);
        return resp;
    });
};

export default init;
