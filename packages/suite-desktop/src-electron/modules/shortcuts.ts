import { app, BrowserWindow } from 'electron';
import electronLocalshortcut from 'electron-localshortcut';

const init = (window: BrowserWindow, src: string) => {
    electronLocalshortcut.register(window, 'CommandOrControl+Alt+I', () => {
        window.webContents.openDevTools();
    });

    electronLocalshortcut.register(window, 'F5', () => {
        window.loadURL(src);
    });

    electronLocalshortcut.register(window, 'CommandOrControl+R', () => {
        window.loadURL(src);
    });

    app.on('before-quit', () => {
        electronLocalshortcut.unregisterAll(window);
    });
};

export default init;
