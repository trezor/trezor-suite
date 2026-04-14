import electronLocalshortcut from 'electron-localshortcut';

import type { ModuleInit } from './module';
import { restartApp } from '../libs/app-utils';

export const SERVICE_NAME = 'shortcuts';

export const init: ModuleInit = ({ mainWindowProxy }) => {
    const { logger } = global;

    mainWindowProxy.on('init', mainWindow => {
        const openDevToolsShortcuts = ['F12', 'CommandOrControl+Shift+I', 'CommandOrControl+Alt+I'];
        openDevToolsShortcuts.forEach(shortcut => {
            electronLocalshortcut.register(mainWindow, shortcut, () => {
                logger.info(SERVICE_NAME, `${shortcut} pressed to open/close DevTools`);

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
                logger.info(SERVICE_NAME, `${shortcut} pressed to reload app`);
                mainWindow.webContents.reload();
            });
        });

        const hardReloadAppShortcuts = ['Shift+F5', 'CommandOrControl+Shift+R'];
        hardReloadAppShortcuts.forEach(shortcut => {
            electronLocalshortcut.register(mainWindow, shortcut, () => {
                logger.info(SERVICE_NAME, `${shortcut} pressed to hard reload app`);
                mainWindow.webContents.reloadIgnoringCache();
            });
        });

        const restartAppShortcuts = ['Option+F5', 'Alt+F5', 'Option+Shift+R', 'Alt+Shift+R'];
        restartAppShortcuts.forEach(shortcut => {
            electronLocalshortcut.register(mainWindow, shortcut, () => {
                logger.info(SERVICE_NAME, `${shortcut} pressed to restart app`);
                restartApp();
            });
        });

        // On Windows, Electron's built-in zoom menu roles (zoomIn, zoomOut, resetZoom) do not
        // work reliably, so we register the shortcuts explicitly here for non-macOS platforms.
        // Ctrl++ sends Ctrl+Shift+= (since + is Shift+=), which the zoomIn role misses on Windows.
        if (process.platform !== 'darwin') {
            const zoomInShortcuts = ['Control+Shift+=', 'Control+='];
            zoomInShortcuts.forEach(shortcut => {
                electronLocalshortcut.register(mainWindow, shortcut, () => {
                    logger.info(SERVICE_NAME, `${shortcut} pressed to zoom in`);
                    mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 1);
                });
            });

            electronLocalshortcut.register(mainWindow, 'Control+-', () => {
                logger.info(SERVICE_NAME, 'Control+- pressed to zoom out');
                mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 1);
            });

            electronLocalshortcut.register(mainWindow, 'Control+0', () => {
                logger.info(SERVICE_NAME, 'Control+0 pressed to reset zoom');
                mainWindow.webContents.setZoomLevel(0);
            });
        }
    });
};
