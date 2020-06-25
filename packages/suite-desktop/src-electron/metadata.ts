import { app, ipcMain } from 'electron';
import fs from 'fs';

const DIR = '/metadata';

export const init = () => {
    console.log('META INIT!');
};

export const saveFile = (name: string, content: any) => {
    const path = app.getPath('userData');
    const dir = `${path}${DIR}`;
    const file = `${path}${DIR}/${name}`;
    console.log('saveFilePATH!', file);

    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(file, content, 'utf-8');
    } catch (error) {
        console.warn('Failed to save the file !', error);
    }
};

export const readFile = (name: string) => {
    const path = app.getPath('userData');
    const file = `${path}${DIR}/${name}`;
    console.log('readFilePATH!', file);

    try {
        if (!fs.existsSync(file)) {
            return false;
        }
        const content = fs.readFileSync(file, 'utf-8');
        return content;
    } catch (error) {
        console.warn('Failed to save the file !', error);
        return false;
    }
};

ipcMain.on('metadata-save', async (event, message) => {
    const result = saveFile(message.file, message.content);
    event.sender.send('metadata-on-save', result);
});

ipcMain.on('metadata-read', async (event, message) => {
    const result = readFile(message.file);
    event.sender.send('metadata-on-read', result);
});
