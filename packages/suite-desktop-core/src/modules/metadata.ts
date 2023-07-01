/**
 * Metadata feature (save/load metadata locally)
 */
import { ipcMain } from '../typed-electron';
import { save, read, readDir } from '../libs/user-data';

import type { Module } from './index';

const DATA_DIR = '/metadata';

export const init: Module = () => {
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

    ipcMain.handle('metadata/get-files', async () => {
        logger.info('metadata', `Retrieving metadata file names from ${DATA_DIR}`);
        const resp = await readDir(DATA_DIR);
        return resp;
    });
};
