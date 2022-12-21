import { ipcMain } from '../../typed-electron';
import type { Module } from '../index';

export const init: Module = () => {
    const { logger } = global;

    ipcMain.on('logger/config', (_, { level, options }) => {
        logger.level = level;

        logger.config = options;
    });
};
