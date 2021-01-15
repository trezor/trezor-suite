import { app } from 'electron';
import electronLocalshortcut from 'electron-localshortcut';

const init = ({ mainWindow, src }: Dependencies) => {
    const { logger } = global;

    electronLocalshortcut.register(mainWindow, 'CommandOrControl+Alt+I', () => {
        logger.info('shortcuts', 'CTRL+ALT+I pressed');
        mainWindow.webContents.openDevTools();
    });

    electronLocalshortcut.register(mainWindow, 'F5', () => {
        logger.info('shortcuts', 'F5 pressed');
        mainWindow.loadURL(src);
    });

    electronLocalshortcut.register(mainWindow, 'CommandOrControl+R', () => {
        logger.info('shortcuts', 'CTRL+R pressed');
        mainWindow.loadURL(src);
    });

    app.on('before-quit', () => {
        electronLocalshortcut.unregisterAll(mainWindow);
    });
};

export default init;
