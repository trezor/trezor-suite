import fs from 'fs';
import os from 'os';
import { app } from 'electron';

export const save = async (directory: string, name: string, content: string) => {
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
        return { success: false, error };
    }
};

export const read = async (directory: string, name: string) => {
    const dir = `${app.getPath('userData')}${directory}`;
    const file = `${dir}/${name}`;

    try {
        await fs.promises.access(file, fs.constants.R_OK);
    } catch {
        return { success: true, payload: undefined };
    }

    try {
        const payload = await fs.promises.readFile(file, 'utf-8');
        return { success: true, payload };
    } catch (error) {
        global.logger.error('user-data', `Read failed: ${error.message}`);
        return { success: false, error };
    }
};

export const getOSVersion = () => {
    try {
        const platform = os.platform();
        const release = os.release();
        return {
            success: true,
            payload: {
                platform,
                release,
            },
        };
    } catch (error) {
        return { success: false, error };
    }
};
