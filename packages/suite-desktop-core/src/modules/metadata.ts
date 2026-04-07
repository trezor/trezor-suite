/**
 * Metadata feature (save/load metadata locally)
 */
import { validateIpcMessage } from '@trezor/ipc-proxy';

import { readBinary, readDir, rename, save } from '../libs/user-data';
import { ipcMain } from '../typed-electron';
import type { ModuleInit } from './module';

const DATA_DIR = '/metadata';

export const SERVICE_NAME = 'metadata';

// Hex string pattern: only hex characters (0-9, a-f, A-F), even length.
const HEX_STRING_REGEX = /^[0-9a-fA-F]+$/;

/**
 * Checks whether a buffer contains a hex-encoded string (as saved by FileSystemProvider)
 * or raw binary data (e.g. copied from Dropbox).
 */
const isHexString = (buffer: Buffer): boolean => {
    const str = buffer.toString('utf-8');

    return str.length > 0 && str.length % 2 === 0 && HEX_STRING_REGEX.test(str);
};

export const init: ModuleInit = () => {
    const { logger } = global;

    ipcMain.handle('metadata/write', async (ipcEvent, message) => {
        validateIpcMessage({ ipcEvent });

        logger.info(SERVICE_NAME, `Writing metadata to ${DATA_DIR}/${message.file}`);
        const resp = await save(DATA_DIR, message.file, message.content, 'utf-8');

        return resp;
    });

    ipcMain.handle('metadata/read', async (ipcEvent, message) => {
        validateIpcMessage({ ipcEvent });

        logger.info(SERVICE_NAME, `Reading metadata from ${DATA_DIR}/${message.file}`);

        // Read file as binary to support both hex-encoded files (from local storage)
        // and raw binary files (e.g. copied from Dropbox).
        const resp = await readBinary(DATA_DIR, message.file);

        if (!resp.success) {
            return resp;
        }

        const buffer = resp.payload;

        if (isHexString(buffer)) {
            // File contains a hex-encoded string saved by FileSystemProvider.
            return { success: true, payload: buffer.toString('utf-8') };
        }

        // File contains raw binary data (e.g. from Dropbox). Convert to hex.
        logger.info(
            SERVICE_NAME,
            `File ${message.file} appears to be in binary format, converting to hex`,
        );

        return { success: true, payload: buffer.toString('hex') };
    });

    ipcMain.handle('metadata/get-files', async ipcEvent => {
        validateIpcMessage({ ipcEvent });

        logger.info(SERVICE_NAME, `Retrieving metadata file names from ${DATA_DIR}`);
        const resp = await readDir(DATA_DIR);

        return resp;
    });

    ipcMain.handle('metadata/rename-file', async (ipcEvent, message) => {
        validateIpcMessage({ ipcEvent });

        const { file, to } = message;
        logger.info(SERVICE_NAME, `Renaming metadata file ${file} name to ${to}`);
        const resp = await rename(DATA_DIR, file, to);

        return resp;
    });
};
