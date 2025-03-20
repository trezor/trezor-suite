import { exec } from 'child_process';

import { isLinux, isMacOs, isWindows } from '@trezor/env-utils';
import { InvokeResult } from '@trezor/suite-desktop-api';

import { ipcMain } from '../typed-electron';

import type { ModuleInit } from './index';

export const SERVICE_NAME = 'system-settings';

const openSettings = (cmd: string, env?: Record<string, string>) =>
    new Promise<InvokeResult>(resolve => {
        exec(cmd, { env: { ...process.env, ...env } }, error => {
            if (error) {
                resolve({ success: false, error: error.toString() });
            } else {
                resolve({ success: true });
            }
        });
    });

const openBluetoothSettings = () => {
    if (isLinux()) {
        // https://github.com/electron/electron/blob/ab2a4fd836d539194bc5cde5f0d665eddeb6a134/docs/api/environment-variables.md?plain=1#L190
        // Electron modifies the value of XDG_CURRENT_DESKTOP
        const xdg = process.env.ORIGINAL_XDG_CURRENT_DESKTOP || process.env.XDG_CURRENT_DESKTOP;
        if (xdg?.includes('GNOME')) {
            return openSettings('gnome-control-center bluetooth', {
                XDG_CURRENT_DESKTOP: xdg,
            });
        } else if (xdg?.includes('KDE')) {
            return openSettings('systemsettings5', {
                XDG_CURRENT_DESKTOP: xdg,
            });
        }
    }
    if (isMacOs()) {
        return openSettings('open "x-apple.systempreferences:com.apple.Bluetooth"');
    }
    if (isWindows()) {
        return openSettings('start ms-settings:bluetooth');
    }

    return { success: false, error: 'Unsupported os' };
};

const openBluetoothPermissions = () => {
    // Settings > Privacy and security > Bluetooth
    if (isMacOs()) {
        return openSettings(
            'open "x-apple.systempreferences:com.apple.preference.security?Privacy_Bluetooth"',
        );
    }

    return { success: false, error: 'Unsupported os' };
};

export const init: ModuleInit = () => {
    ipcMain.handle('system/open-settings', (_, settings) => {
        if (settings === 'bluetooth') {
            return openBluetoothSettings();
        }
        if (settings === 'bluetooth-permissions') {
            return openBluetoothPermissions();
        }

        return { success: false, error: `Unknown settings: ${settings}` };
    });
};
