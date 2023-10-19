import { app } from 'electron';

import type { Module } from '../index';

const logUI = app.commandLine.hasSwitch('log-ui');

export const SERVICE_NAME = 'content';

export const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedUrl) => {
        logger.error(
            SERVICE_NAME,
            `Failure to load ${validatedUrl} (${errorCode} - ${errorDescription})`,
        );
    });

    mainWindow.webContents.on('will-navigate', (_, url) => {
        logger.info(SERVICE_NAME, `Navigate to ${url}`);
    });

    mainWindow.webContents.on('render-process-gone', (_, { reason }) => {
        logger.error(SERVICE_NAME, `Render process gone (reason: ${reason})`);
    });

    let unresponsiveStart = 0;
    mainWindow.webContents.on('unresponsive', () => {
        unresponsiveStart = +new Date();
        logger.warn(SERVICE_NAME, 'Unresponsive');
    });

    mainWindow.webContents.on('responsive', () => {
        if (unresponsiveStart !== 0) {
            logger.warn(
                SERVICE_NAME,
                `Responsive again after ${(+new Date() - unresponsiveStart / 1000).toFixed(1)}s`,
            );
            unresponsiveStart = 0;
        }
    });

    mainWindow.webContents.on('devtools-opened', () => {
        logger.info(SERVICE_NAME, `Dev tools opened`);
    });

    mainWindow.webContents.on('devtools-closed', () => {
        logger.info(SERVICE_NAME, `Dev tools closed`);
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
