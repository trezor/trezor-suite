import { ipcMain } from '../../typed-electron';
import type { ModuleInit } from '../index';

export const SERVICE_NAME = 'event-logging';

export const init: ModuleInit = () => {
    const { logger } = global;

    ipcMain.on('logger/config', (_, { level, options }) => {
        logger.level = level;

        logger.config = options;
    });
};
