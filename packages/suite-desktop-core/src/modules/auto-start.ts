/**
 * Auto start handler
 */
import { validateIpcMessage } from '@trezor/ipc-proxy';

import { isAutoStartEnabled, linuxAutoStart, setAutoStartEnabled } from '../libs/auto-start';
import { ipcMain } from '../typed-electron';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'auto-start';

export const init: ModuleInit = () => {
    const { logger } = global;

    ipcMain.on('app/auto-start', (_, enabled: boolean) => {
        logger.debug(SERVICE_NAME, 'Auto start ' + (enabled ? 'enabled' : 'disabled'));
        setAutoStartEnabled(enabled);
    });

    ipcMain.handle('app/auto-start/is-enabled', ipcEvent => {
        validateIpcMessage({ ipcEvent });
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
