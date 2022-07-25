import electronLocalshortcut from 'electron-localshortcut';
import { APP_SRC } from '../libs/constants';
import type { Module } from './index';

const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    const openDevToolsShortcuts = ['F12', 'CommandOrControl+Shift+I', 'CommandOrControl+Alt+I'];
    openDevToolsShortcuts.forEach(shortcut => {
        electronLocalshortcut.register(mainWindow, shortcut, () => {
            logger.info('shortcuts', `${shortcut} pressed to open/close DevTools`);

            if (mainWindow.webContents.isDevToolsOpened()) {
                mainWindow.webContents.closeDevTools();
            } else {
                mainWindow.webContents.openDevTools();
            }
        });
    });

    electronLocalshortcut.register(mainWindow, 'F5', () => {
        logger.info('shortcuts', 'F5 pressed');
        mainWindow.loadURL(APP_SRC);
    });

    electronLocalshortcut.register(mainWindow, 'CommandOrControl+R', () => {
        logger.info('shortcuts', 'CTRL+R pressed');
        mainWindow.loadURL(APP_SRC);
    });
};

export default init;
