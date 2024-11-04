/**
 * Metadata feature (save/load metadata locally)
 */
import { validateIpcMessage } from '@trezor/ipc-proxy';

import { ipcMain } from '../typed-electron';
import { save, read, readDir, rename } from '../libs/user-data';

import type { ModuleInit } from './index';

const DATA_DIR = '/metadata';

export const SERVICE_NAME = 'metadata';

export const init: ModuleInit = () => {
    const { logger } = global;

    ipcMain.handle('metadata/write', async (ipcEvent, message) => {
        validateIpcMessage(ipcEvent);

        logger.info(SERVICE_NAME, `Writing metadata to ${DATA_DIR}/${message.file}`);
        const resp = await save(DATA_DIR, message.file, message.content);

        return resp;
    });

    ipcMain.handle('metadata/read', async (ipcEvent, message) => {
        validateIpcMessage(ipcEvent);

        logger.info(SERVICE_NAME, `Reading metadata from ${DATA_DIR}/${message.file}`);
        const resp = await read(DATA_DIR, message.file);

        return resp;
    });

    ipcMain.handle('metadata/get-files', async ipcEvent => {
        validateIpcMessage(ipcEvent);

        logger.info(SERVICE_NAME, `Retrieving metadata file names from ${DATA_DIR}`);
        const resp = await readDir(DATA_DIR);

        return resp;
    });

    ipcMain.handle('metadata/rename-file', async (ipcEvent, message) => {
        validateIpcMessage(ipcEvent);

        const { file, to } = message;
        logger.info(SERVICE_NAME, `Renaming metadata file ${file} name to ${to}`);
        const resp = await rename(DATA_DIR, file, to);

        return resp;
    });
};
