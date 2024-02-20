/**
 * Metadata feature (save/load metadata locally)
 */
import { ipcMain } from '../typed-electron';
import { save, read, readDir, rename } from '../libs/user-data';

import type { Module } from './index';

const DATA_DIR = '/metadata';

export const SERVICE_NAME = 'metadata';

export const init: Module = () => {
    const { logger } = global;

    ipcMain.handle('metadata/write', async (_, message) => {
        logger.info(SERVICE_NAME, `Writing metadata to ${DATA_DIR}/${message.file}`);
        const resp = await save(DATA_DIR, message.file, message.content);

        return resp;
    });

    ipcMain.handle('metadata/read', async (_, message) => {
        logger.info(SERVICE_NAME, `Reading metadata from ${DATA_DIR}/${message.file}`);
        const resp = await read(DATA_DIR, message.file);

        return resp;
    });

    ipcMain.handle('metadata/get-files', async () => {
        logger.info(SERVICE_NAME, `Retrieving metadata file names from ${DATA_DIR}`);
        const resp = await readDir(DATA_DIR);

        return resp;
    });

    ipcMain.handle('metadata/rename-file', async (_, message) => {
        const { file, to } = message;
        logger.info(SERVICE_NAME, `Renaming metadata file ${file} name to ${to}`);
        const resp = await rename(DATA_DIR, file, to);

        return resp;
    });
};
