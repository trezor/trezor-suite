import { BrowserWindow } from 'electron';
import * as path from 'path';

export const openOauthPopup = (url: string) => {
    const popup = new BrowserWindow({
        // alwaysOnTop: true,
        closable: true,
        minimizable: false,
        // height: 480,
        // width: 720,
        useContentSize: true,
        frame: true, // needed to make it closable on linux, as closable prop does not work there,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    popup.loadURL(url);
    popup.once('ready-to-show', () => {
        popup.show();
    });
};
