/**
 * Auto start handler
 */
import { BrowserWindow } from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { validateIpcMessage } from '@trezor/ipc-proxy';
import { createDeferred } from '@trezor/utils';

import { Store } from '../libs/store';
import { app, ipcMain } from '../typed-electron';

import type { ModuleInit } from './index';

export const SERVICE_NAME = 'auto-start';

// Linux autostart desktop file
const getLinuxExecutable = () => {
    if (process.env.container) {
        return 'flatpak run io.trezor.suite';
    }
    if (process.env.APPIMAGE) {
        return `"${process.env.APPIMAGE}"`;
    }

    return `"${process.execPath}"`;
};

const LINUX_AUTOSTART_DIR = '.config/autostart/';
const LINUX_AUTOSTART_FILE = 'Trezor-Suite.desktop';
const LINUX_DESKTOP = `[Desktop Entry]
Type=Application
Version=1.0
Name=Trezor Suite
Comment=Trezor Suite startup script
Exec=${getLinuxExecutable()} --bridge-daemon
StartupNotify=false
Terminal=false
`;

export const isAutoStartEnabled = () => {
    if (process.platform === 'linux') {
        return fs.existsSync(path.join(os.homedir(), LINUX_AUTOSTART_DIR, LINUX_AUTOSTART_FILE));
    } else if (process.platform === 'win32') {
        return (
            app.getLoginItemSettings().openAtLogin ||
            app.getLoginItemSettings().executableWillLaunchAtLogin
        );
    } else {
        return app.getLoginItemSettings().openAtLogin;
    }
};

const linuxAutoStart = (enabled: boolean) => {
    if (enabled) {
        fs.mkdirSync(path.join(os.homedir(), LINUX_AUTOSTART_DIR), { recursive: true });
        fs.writeFileSync(
            path.join(os.homedir(), LINUX_AUTOSTART_DIR, LINUX_AUTOSTART_FILE),
            LINUX_DESKTOP,
        );
        fs.chmodSync(path.join(os.homedir(), LINUX_AUTOSTART_DIR, LINUX_AUTOSTART_FILE), 0o755);
    } else {
        if (isAutoStartEnabled()) {
            fs.unlinkSync(path.join(os.homedir(), LINUX_AUTOSTART_DIR, LINUX_AUTOSTART_FILE));
        }
    }
};

export const setAutoStartEnabled = (enabled: boolean) => {
    if (process.platform === 'linux') {
        // For Linux, we use a custom implementation
        linuxAutoStart(enabled);
    } else {
        // For Windows and macOS, we use native Electron API
        app.setLoginItemSettings({
            openAtLogin: enabled,
            openAsHidden: true,
            args: ['--bridge-daemon'],
        });
    }
};

/**
 * Prompt user to enable auto start before quitting the app
 * @param mainWindow - Main window to show the dialog
 * @returns continue - if true continue the flow of closing the app, if false, stop and only hide the window
 */
export const promptForAutoStartBeforeQuit = async (mainWindow: BrowserWindow, store: Store) => {
    if (
        isAutoStartEnabled() ||
        store.getConnectSettings().autoStartDontAskAgain ||
        !store.getConnectSettings().hasUsedConnectWs
    ) {
        return true;
    }

    // Display popup in renderer and wait for response
    const deferredResponse = createDeferred<
        'background-always' | 'background-now' | 'quit-always' | 'quit-now'
    >();
    let modalShown = false;
    ipcMain.removeHandler('app/auto-start/popup-ack');
    ipcMain.removeHandler('app/auto-start/popup-response');
    ipcMain.handleOnce('app/auto-start/popup-ack', ipcEvent => {
        validateIpcMessage(ipcEvent);
        modalShown = true;
    });
    ipcMain.handleOnce('app/auto-start/popup-response', (ipcEvent, response) => {
        validateIpcMessage(ipcEvent);
        deferredResponse.resolve(response);
    });
    mainWindow.webContents.send('app/auto-start/popup-request');

    // Fallback if modal not shown at the moment
    // This can happen on some screens like onboarding, where normal modal might not be shown
    setTimeout(() => {
        if (!modalShown) deferredResponse.resolve('quit-now');
    }, 1000);

    const response = await deferredResponse.promise;

    switch (response) {
        case 'background-always': {
            setAutoStartEnabled(true);

            return true;
        }
        case 'background-now': {
            return false;
        }
        case 'quit-always': {
            store.setConnectSettings({ autoStartDontAskAgain: true });

            return true;
        }
        default:
        case 'quit-now': {
            return true;
        }
    }
};

export const init: ModuleInit = () => {
    const { logger } = global;

    ipcMain.on('app/auto-start', (_, enabled: boolean) => {
        logger.debug(SERVICE_NAME, 'Auto start ' + (enabled ? 'enabled' : 'disabled'));
        setAutoStartEnabled(enabled);
    });

    ipcMain.handle('app/auto-start/is-enabled', ipcEvent => {
        validateIpcMessage(ipcEvent);
        const result = isAutoStartEnabled();

        return { success: true, payload: result };
    });

    return {
        onLoad: () => {
            // Update autostart file on Linux, since the AppImage might have been moved
            if (process.platform === 'linux' && isAutoStartEnabled()) {
                linuxAutoStart(true);
            }
        },
    };
};
