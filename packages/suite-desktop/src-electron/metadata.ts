import { app, ipcMain } from 'electron';
import fs from 'fs';

const DIR = '/metadata';

/**
 * Register metadata related event listeners
 */
export const init = () => {
    const saveFile = (name: string, content: string) => {
        const path = app.getPath('userData');
        const dir = `${path}${DIR}`;
        const file = `${path}${DIR}/${name}`;

        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            fs.writeFileSync(file, content, 'utf-8');
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    };

    const readFile = (name: string) => {
        const path = app.getPath('userData');
        const file = `${path}${DIR}/${name}`;

        try {
            if (!fs.existsSync(file)) {
                return { success: true, payload: undefined };
            }
            const payload = fs.readFileSync(file, 'utf-8');
            return { success: true, payload };
        } catch (error) {
            return { success: false, error };
        }
    };

    ipcMain.handle('metadata/write', (_event, message) => {
        return saveFile(message.file, message.content);
    });

    ipcMain.handle('metadata/read', (_event, message) => {
        return readFile(message.file);
    });
};
