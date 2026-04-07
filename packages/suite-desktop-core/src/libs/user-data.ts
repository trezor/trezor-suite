import { app, shell } from 'electron';
import fs from 'fs';
import path from 'path';

import { isDevEnv } from '@suite-common/suite-utils';
import type { InvokeResult } from '@trezor/suite-desktop-api';
import type { Result } from '@trezor/type-utils';

const resolveDirectoryInUserDataDir = (directory: string): Result<{ dir: string }, string> => {
    const userDataDir = path.resolve(app.getPath('userData'));
    const dir = path.resolve(path.join(userDataDir, directory));

    if (!dir.startsWith(userDataDir)) {
        return {
            success: false,
            error: `Path traversal attempt detected, directory: "${directory}"`,
        };
    }

    return { success: true, payload: { dir } };
};

const resolvePathInUserDataDir = (
    directory: string,
    filename: string,
): Result<{ dir: string; file: string }, string> => {
    const dirResult = resolveDirectoryInUserDataDir(directory);
    if (!dirResult.success) {
        return dirResult;
    }
    const { dir } = dirResult.payload;
    const file = path.resolve(dir, filename);

    if (!file.startsWith(dir + path.sep)) {
        return {
            success: false,
            error: `Path traversal attempt detected, file: "${filename}"`,
        };
    }

    return { success: true, payload: { dir, file } };
};

export const clearAppCache = () =>
    new Promise<void>((resolve, reject) => {
        const cachePath = path.join(app.getPath('userData'), 'Cache');
        fs.rm(cachePath, { recursive: true }, err => (err ? reject(err) : resolve()));
    });

/**
 * By default, Electron uses the app name from package.json to construct the userData directory.
 * It's overwritten in electron-builder-config.js for builds. And here for local development.
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

export const save: {
    (directory: string, name: string, content: string, encoding: 'utf-8'): Promise<InvokeResult>;
    (
        directory: string,
        name: string,
        content: ArrayBuffer,
        encoding: 'binary',
    ): Promise<InvokeResult>;
} = async (directory, name, content, encoding) => {
    const resolvedPathResult = resolvePathInUserDataDir(directory, name);
    if (!resolvedPathResult.success) {
        return { success: false, error: resolvedPathResult.error };
    }
    const { dir, file } = resolvedPathResult.payload;

    let data: string | Buffer;
    if (encoding === 'binary') {
        data = Buffer.from(content as ArrayBuffer);
    } else {
        data = content as string;
    }

    try {
        try {
            await fs.promises.access(dir, fs.constants.R_OK);
        } catch {
            await fs.promises.mkdir(dir);
        }

        await fs.promises.writeFile(file, data, encoding);

        return { success: true };
    } catch (error) {
        global.logger.error('user-data', `Save failed: ${error.message}`);

        return { success: false, error: error.message, code: error.code };
    }
};

export const read = async (directory: string, name: string): Promise<InvokeResult<string>> => {
    const resolvedPathResult = resolvePathInUserDataDir(directory, name);
    if (!resolvedPathResult.success) {
        return { success: false, error: resolvedPathResult.error };
    }
    const { file } = resolvedPathResult.payload;

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

export const readBinary = async (
    directory: string,
    name: string,
): Promise<InvokeResult<Buffer>> => {
    const resolvedPathResult = resolvePathInUserDataDir(directory, name);
    if (!resolvedPathResult.success) {
        return { success: false, error: resolvedPathResult.error };
    }
    const { file } = resolvedPathResult.payload;

    try {
        await fs.promises.access(file, fs.constants.R_OK);
    } catch (error) {
        return { success: false, error: error.message, code: error.code };
    }

    try {
        const payload = await fs.promises.readFile(file);

        return { success: true, payload };
    } catch (error) {
        global.logger.error('user-data', `Read failed: ${error.message}`);

        return { success: false, error: error.message, code: error.code };
    }
};

export const readDir = async (directory: string): Promise<InvokeResult<string[]>> => {
    const resolvedDirResult = resolveDirectoryInUserDataDir(directory);
    if (!resolvedDirResult.success) {
        return { success: false, error: resolvedDirResult.error };
    }
    const { dir } = resolvedDirResult.payload;

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
    const resolvedFromResult = resolvePathInUserDataDir(directory, from);
    if (!resolvedFromResult.success) {
        return { success: false, error: resolvedFromResult.error };
    }
    const { file: fromPath } = resolvedFromResult.payload;

    const resolvedToResult = resolvePathInUserDataDir(directory, to);
    if (!resolvedToResult.success) {
        return { success: false, error: resolvedToResult.error };
    }
    const { file: toPath } = resolvedToResult.payload;

    try {
        await fs.promises.rename(fromPath, toPath);

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
    const resolvedDirResult = resolveDirectoryInUserDataDir(directory);
    if (!resolvedDirResult.success) {
        return { success: false, error: resolvedDirResult.error };
    }
    const { dir } = resolvedDirResult.payload;

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
