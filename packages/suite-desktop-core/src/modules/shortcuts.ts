import electronLocalshortcut from 'electron-localshortcut';

import { isCodesignBuild } from '@trezor/env-utils';

import type { ModuleInit } from './module';
import { restartApp } from '../libs/app-utils';
import { hasSwitch } from '../libs/process-switches';

export const SERVICE_NAME = 'shortcuts';

// DevTools are only available in development, or in production when explicitly enabled via CLI flag.
const isDevToolsEnabled = !isCodesignBuild() || hasSwitch('open-devtools');

export const init: ModuleInit = ({ mainWindowProxy }) => {
    const { logger } = global;

    mainWindowProxy.on('init', mainWindow => {
        if (isDevToolsEnabled) {
            const openDevToolsShortcuts = [
                'F12',
                'CommandOrControl+Shift+I',
                'CommandOrControl+Alt+I',
            ];
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
        }

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
    });
};
