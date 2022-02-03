import fs from 'fs';
import { app } from 'electron';
import { InvokeResult } from '@trezor/suite-desktop-api';

export const save = async (
    directory: string,
    name: string,
    content: string,
): Promise<InvokeResult> => {
    const dir = `${app.getPath('userData')}${directory}`;
    const file = `${dir}/${name}`;

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
    const dir = `${app.getPath('userData')}${directory}`;
    const file = `${dir}/${name}`;

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

export const clear = async (): Promise<InvokeResult> => {
    const dir = app.getPath('userData');
    try {
        await fs.promises.rm(dir, { recursive: true, force: true });
        return { success: true };
    } catch (error) {
        global.logger.error('user-data', `Remove dir failed: ${error.message}`);
        return { success: false, error: error.message, code: error.code };
    }
};

export const getInfo = (): InvokeResult<{ dir: string }> => {
    const dir = app.getPath('userData');
    try {
        return {
            success: true,
            payload: {
                dir,
                // possibly more info can be returned (size, last modified,...)
            },
        };
    } catch (error) {
        global.logger.error('user-data', `getInfo failed: ${error.message}`);
        return { success: false, error: error.message, code: error.code };
    }
};
