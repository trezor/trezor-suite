import { ipcMain } from '../../ipcMain';
import type { ModuleInit } from '../module';

export const SERVICE_NAME = 'event-logging';

export const init: ModuleInit = ({ logger }) => {
    ipcMain.on('logger/config', (_, { level, writeToDisk }) => {
        logger.level = level;
        logger.config = { writeToDisk };
    });
};
