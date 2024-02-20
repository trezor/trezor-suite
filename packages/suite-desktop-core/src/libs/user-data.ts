import fs from 'fs';
import path from 'path';
import { app, shell } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';
import { InvokeResult } from '@trezor/suite-desktop-api';

export const clearAppCache = () =>
    new Promise<void>((resolve, reject) => {
        const cachePath = path.join(app.getPath('userData'), 'Cache');
        fs.rm(cachePath, { recursive: true }, err => (err ? reject(err) : resolve()));
    });

/**
 * By default, Electron uses the app name from package.json to construct the userData directory.
 * It's overriten in electron-builder-config.js for builds. And here for local development.
 * Default (codesigned builds): @trezor/suite-desktop,
 * Dev (non-production builds): @trezor/suite-desktop-dev
 * Local development: @trezor/suite-desktop-local
 */
export const initUserData = () => {
    if (isDevEnv) {
        const userDataDirDefault = app.getPath('userData');
        const userDataDir = `${userDataDirDefault}-local`;
        try {
            fs.accessSync(userDataDir, fs.constants.R_OK);
        } catch {
            fs.mkdirSync(userDataDir);
        }
        app.setPath('userData', userDataDir);
    }
};

export const save = async (
    directory: string,
    name: string,
    content: string,
): Promise<InvokeResult> => {
    const dir = path.join(app.getPath('userData'), directory);
    const file = path.join(dir, name);

    try {
        try {
            await fs.promises.access(dir, fs.constants.R_OK);
        } catch {
            await fs.promises.mkdir(dir);
        }

        await fs.promises.writeFile(file, content, 'utf-8');

        return { success: true };
    } catch (error) {
        global.logger.error('user-data', `Save failed: ${error.message}`);

        return { success: false, error: error.message, code: error.code };
    }
};

export const read = async (directory: string, name: string): Promise<InvokeResult<string>> => {
    const dir = path.join(app.getPath('userData'), directory);
    const file = path.join(dir, name);

    try {
        await fs.promises.access(file, fs.constants.R_OK);
    } catch (error) {
        return { success: false, error: error.message, code: error.code };
    }

    try {
        const payload = await fs.promises.readFile(file, 'utf-8');

        return { success: true, payload };
    } catch (error) {
        global.logger.error('user-data', `Read failed: ${error.message}`);

        return { success: false, error: error.message, code: error.code };
    }
};

export const readDir = async (directory: string): Promise<InvokeResult<string[]>> => {
    const dir = path.join(app.getPath('userData'), directory);

    try {
        await fs.promises.access(dir, fs.constants.R_OK);
    } catch {
        await fs.promises.mkdir(dir);

        return { success: true, payload: [] };
    }

    try {
        const dirFiles = await fs.promises.readdir(dir);
        const filteredDirFiles = dirFiles.filter(file => !file.startsWith('.'));

        return { success: true, payload: filteredDirFiles };
    } catch (error) {
        global.logger.error('user-data', `Get folder file names failed: ${error.message}`);

        return { success: false, error: error.message, code: error.code };
    }
};

export const rename = async (
    directory: string,
    from: string,
    to: string,
): Promise<InvokeResult> => {
    const dir = path.join(app.getPath('userData'), directory);

    try {
        await fs.promises.rename(path.join(dir, from), path.join(dir, to));

        return { success: true };
    } catch (error) {
        global.logger.error('user-data', `Rename file name failed: ${error.message}`);

        return { success: false, error: error.message, code: error.code };
    }
};

export const clear = async (): Promise<InvokeResult> => {
    const dir = path.normalize(app.getPath('userData'));
    try {
        await fs.promises.rm(dir, { recursive: true, force: true });

        return { success: true };
    } catch (error) {
        global.logger.error('user-data', `Remove dir failed: ${error.message}`);

        return { success: false, error: error.message, code: error.code };
    }
};

export const getInfo = () => ({
    // Wrapped in path.normalize to make it multiplatform, otherwise path on Windows is broken.
    dir: path.normalize(app.getPath('userData')),
});

export const open = async (directory: string): Promise<InvokeResult> => {
    const dir = path.join(app.getPath('userData'), directory);
    try {
        const errorMessage = await shell.openPath(dir);
        if (errorMessage) {
            throw new Error(errorMessage);
        }

        return { success: true };
    } catch (error) {
        global.logger.error('user-data', `Opening user data directory failed: ${error.message}`);

        return { success: false, error: error.message, code: error.code };
    }
};
