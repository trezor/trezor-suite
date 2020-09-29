import { BrowserWindow } from 'electron';
import * as path from 'path';

export const openBuyWindow = (url: string) => {
    const win = new BrowserWindow({
        alwaysOnTop: true,
        closable: true,
        minimizable: false,
        useContentSize: true,
        frame: true, // needed to make it closable on linux, as closable prop does not work there,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    win.loadURL(url);
};
