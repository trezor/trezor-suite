/**
 * Metadata feature (save/load metadata locally)
 */
import { ipcMain } from '../ipcMain';
import type { ModuleInit } from './module';
import { read, readDir, rename, save } from '../libs/user-data';

const DATA_DIR = '/metadata';

export const SERVICE_NAME = 'metadata';

export const init: ModuleInit = ({ logger }) => {
    ipcMain.handle('metadata/write', async (_, message) => {
        logger.info(SERVICE_NAME, `Writing metadata to ${DATA_DIR}/${message.file}`);
        const resp = await save({
            directory: DATA_DIR,
            name: message.file,
            content: message.content,
            encoding: 'utf-8',
            logger,
        });

        return resp;
    });

    ipcMain.handle('metadata/read', async (_, message) => {
        logger.info(SERVICE_NAME, `Reading metadata from ${DATA_DIR}/${message.file}`);
        const resp = await read({
            directory: DATA_DIR,
            name: message.file,
            logger,
        });

        return resp;
    });

    ipcMain.handle('metadata/get-files', async () => {
        logger.info(SERVICE_NAME, `Retrieving metadata file names from ${DATA_DIR}`);
        const resp = await readDir({
            directory: DATA_DIR,
            logger,
        });

        return resp;
    });

    ipcMain.handle('metadata/rename-file', async (_, message) => {
        const { file, to } = message;
        logger.info(SERVICE_NAME, `Renaming metadata file ${file} name to ${to}`);
        const resp = await rename({
            directory: DATA_DIR,
            from: file,
            to,
            logger,
        });

        return resp;
    });
};
