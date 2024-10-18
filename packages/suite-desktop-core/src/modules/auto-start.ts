/**
 * Auto start handler
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

import { validateIpcMessage } from '@trezor/ipc-proxy';

import { app, ipcMain } from '../typed-electron';

import type { Module } from './index';

export const SERVICE_NAME = 'auto-start';

// Linux autostart desktop file
const getLiunxExecutable = () => {
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
Exec=${getLiunxExecutable()} --bridge-daemon
StartupNotify=false
Terminal=false
`;

const isAutoStartEnabled = () => {
    if (process.platform === 'linux') {
        return fs.existsSync(path.join(os.homedir(), LINUX_AUTOSTART_DIR, LINUX_AUTOSTART_FILE));
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

export const init: Module = () => {
    const { logger } = global;

    ipcMain.on('app/auto-start', (_, enabled: boolean) => {
        logger.debug(SERVICE_NAME, 'Auto start ' + (enabled ? 'enabled' : 'disabled'));
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
