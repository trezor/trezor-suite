import { app } from 'electron';

import type { Module } from '../index';

export const init: Module = () => {
    const { logger } = global;

    app.on('ready', () => {
        logger.info('app', 'Ready');
    });

    app.on('before-quit', () => {
        logger.info('app', 'Quitting');
    });

    app.on('window-all-closed', () => {
        logger.info('app', 'All windows closed');
    });

    app.on('child-process-gone', (_, { type, reason }) => {
        logger.error('app', `Child process (${type}) gone (reason: ${reason})`);
    });
};
