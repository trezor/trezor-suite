import { app } from 'electron';
import electronLocalshortcut from 'electron-localshortcut';

const init = ({ mainWindow, src }: Dependencies) => {
    const { logger } = global;

    // Register more shortcuts for opening dev tools
    const openDevToolsShortcuts = ['CommandOrControl+Shift+I', 'CommandOrControl+Alt+I'];
    openDevToolsShortcuts.forEach(shortcut => {
        electronLocalshortcut.register(mainWindow, shortcut, () => {
            logger.info('shortcuts', `${shortcut} pressed`);
            mainWindow.webContents.openDevTools();
        });
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
