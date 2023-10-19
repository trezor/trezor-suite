import { app } from 'electron';

import type { Module } from '../index';

export const SERVICE_NAME = 'app';

export const init: Module = () => {
    const { logger } = global;

    app.on('ready', () => {
        logger.info(SERVICE_NAME, 'Ready');
    });

    app.on('before-quit', () => {
        logger.info(SERVICE_NAME, 'Quitting');
    });

    app.on('window-all-closed', () => {
        logger.info(SERVICE_NAME, 'All windows closed');
    });

    app.on('child-process-gone', (_, { type, reason }) => {
        logger.error(SERVICE_NAME, `Child process (${type}) gone (reason: ${reason})`);
    });
};
