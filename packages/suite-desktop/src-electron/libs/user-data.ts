import fs from 'fs';
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
        return { success: false, error };
    }
};
