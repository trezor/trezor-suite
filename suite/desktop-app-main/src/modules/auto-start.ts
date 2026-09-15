/**
 * Auto start handler
 */
import { ipcMain } from '../ipcMain';
import type { ModuleInit } from './module';
import { isAutoStartEnabled, linuxAutoStart, setAutoStartEnabled } from '../libs/auto-start';

export const SERVICE_NAME = 'auto-start';

export const init: ModuleInit = () => {
    const { logger } = global;

    ipcMain.on('app/auto-start', (_, enabled: boolean) => {
        logger.debug(SERVICE_NAME, 'Auto start ' + (enabled ? 'enabled' : 'disabled'));
        setAutoStartEnabled(enabled);
    });

    ipcMain.handle('app/auto-start/is-enabled', () => {
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
