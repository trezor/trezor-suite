import { app } from 'electron';

import { Module } from '../index';

const logUI = app.commandLine.hasSwitch('log-ui');

export const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedUrl) => {
        logger.error(
            'content',
            `Failure to load ${validatedUrl} (${errorCode} - ${errorDescription})`,
        );
    });

    mainWindow.webContents.on('will-navigate', (_, url) => {
        logger.info('content', `Navigate to ${url}`);
    });

    mainWindow.webContents.on('render-process-gone', (_, { reason }) => {
        logger.error('content', `Render process gone (reason: ${reason})`);
    });

    let unresponsiveStart = 0;
    mainWindow.webContents.on('unresponsive', () => {
        unresponsiveStart = +new Date();
        logger.warn('content', 'Unresponsive');
    });

    mainWindow.webContents.on('responsive', () => {
        if (unresponsiveStart !== 0) {
            logger.warn(
                'content',
                `Responsive again after ${(+new Date() - unresponsiveStart / 1000).toFixed(1)}s`,
            );
            unresponsiveStart = 0;
        }
    });

    mainWindow.webContents.on('devtools-opened', () => {
        logger.info('content', `Dev tools opened`);
    });

    mainWindow.webContents.on('devtools-closed', () => {
        logger.info('content', `Dev tools closed`);
    });

    if (logUI) {
        const levels = ['debug', 'info', 'warn', 'error'] as const;
        mainWindow.webContents.on('console-message', (_, level, message, line, sourceId) => {
            const method = levels[level];
            if (!method) return;
            if (message.startsWith('%c')) return; // ignore redux-logger
            if (message.startsWith('console.groupEnd')) return; // ignore redux-logger

            logger[method](
                'ui-log',
                method !== 'error' ? message : [message, `${sourceId}:${line}`],
            );
        });
    }
};
