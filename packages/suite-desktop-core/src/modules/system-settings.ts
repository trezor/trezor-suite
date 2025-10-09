import { exec } from 'child_process';

import { isLinux, isMacOs, isWindows } from '@trezor/env-utils';
import { InvokeResult } from '@trezor/suite-desktop-api';

import { ipcMain } from '../typed-electron';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'system-settings';

const getOSErrorDescription = (reason: string) =>
    `Cannot open system settings (${reason}). Please open the settings manually.`;

// If opening system settings was attempted but failed, try to guess the reason of failure.
const detectFailureReason = (error: Error) => {
    const flatpakId = process.env.FLATPAK_ID ?? process.env.FLATPAK_APP_ID;
    if (flatpakId !== undefined && flatpakId !== '') {
        return getOSErrorDescription('running in Flatpak sandbox');
    }

    // cannot detect reason, return original error
    return error.toString();
};

const openSettings = (cmd: string, env?: Record<string, string>) =>
    new Promise<InvokeResult>(resolve => {
        exec(cmd, { env: { ...process.env, ...env } }, error => {
            if (error) {
                const errorMessage = detectFailureReason(error);
                resolve({ success: false, error: errorMessage });
            } else {
                resolve({ success: true });
            }
        });
    });

/**
 * Try to open system Bluetooth settings with respect to the operating system,
 * or a particular desktop environment in case of Linux (Gnome or KDE supported).
 * In case of other systems, fail right away without attempting it.
 */
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

    return { success: false, error: getOSErrorDescription('unsupported system') };
};

/**
 * Try to open system Bluetooth permissions settings, which is only relevant on macOS (otherwise fail right away).
 */
const openBluetoothPermissions = () => {
    // Settings > Privacy and security > Bluetooth
    if (isMacOs()) {
        return openSettings(
            'open "x-apple.systempreferences:com.apple.preference.security?Privacy_Bluetooth"',
        );
    }

    return { success: false, error: getOSErrorDescription('unsupported system') };
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
