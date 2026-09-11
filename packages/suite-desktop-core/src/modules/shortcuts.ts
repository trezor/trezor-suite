import electronLocalshortcut from 'electron-localshortcut';

import { isCodesignBuild } from '@trezor/env-utils';

import type { ModuleInit } from './module';
import { restartApp } from '../libs/app-utils';
import { hasSwitch } from '../libs/process-switches';
import { Store } from '../libs/store';

export const SERVICE_NAME = 'shortcuts';

export const init: ModuleInit = ({ mainWindowProxy }) => {
    const { logger } = global;
    const store = Store.getStore();

    // DevTools are disabled by default, to avoid inadvertent self-XSS for users. But for development & testing convenience, it's available either:
    // always on a dev build, or if Suite was executed with --open-devtools arg, or with Debug settings on (the only way to toggle it during runtime).
    const getIsDevToolsEnabled = () =>
        !isCodesignBuild() || hasSwitch('open-devtools') || store.getIsDebugModeActive();

    mainWindowProxy.on('init', mainWindow => {
        const openDevToolsShortcuts = ['F12', 'CommandOrControl+Shift+I', 'CommandOrControl+Alt+I'];
        openDevToolsShortcuts.forEach(shortcut => {
            electronLocalshortcut.register(mainWindow, shortcut, () => {
                if (!getIsDevToolsEnabled()) return;
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
    });
};
