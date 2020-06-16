import { BrowserWindow } from 'electron';
import * as path from 'path';

export const openOauthPopup = (url: string) => {
    const popup = new BrowserWindow({
        // alwaysOnTop: true,
        minimizable: false,
        height: 480,
        width: 720,
        frame: false,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    popup.loadURL(url);
    popup.once('ready-to-show', () => {
        popup.show();
    });
};
