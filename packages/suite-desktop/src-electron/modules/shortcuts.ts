import electronLocalshortcut from 'electron-localshortcut';

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

    const reloadAppShortcuts = ['F5', 'CommandOrControl+R'];
    reloadAppShortcuts.forEach(shortcut => {
        electronLocalshortcut.register(mainWindow, shortcut, () => {
            logger.info('shortcuts', `${shortcut} pressed to reload app`);
            mainWindow.webContents.reload();
        });
    });

    const hardReloadAppShortcuts = ['Shift+F5', 'CommandOrControl+Shift+R'];
    hardReloadAppShortcuts.forEach(shortcut => {
        electronLocalshortcut.register(mainWindow, shortcut, () => {
            logger.info('shortcuts', `${shortcut} pressed to hard reload app`);
            mainWindow.webContents.reloadIgnoringCache();
        });
    });
};

export default init;
