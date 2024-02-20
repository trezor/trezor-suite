/**
 * Local web server for handling requests to app
 */
import { app, ipcMain } from '../typed-electron';
import { createHttpReceiver } from '../libs/http-receiver';

import type { Module } from './index';

export const SERVICE_NAME = 'http-receiver';

export const init: Module = ({ mainWindow }) => {
    const { logger } = global;
    let httpReceiver: ReturnType<typeof createHttpReceiver> | null = null;

    return async () => {
        if (httpReceiver) {
            return httpReceiver.getInfo();
        }
        // External request handler
        const receiver = createHttpReceiver();
        httpReceiver = receiver;

        // wait for httpReceiver to start accepting connections then register event handlers
        receiver.on('server/listening', () => {
            // when httpReceiver accepted oauth response
            receiver.on('oauth/response', message => {
                mainWindow.webContents.send('oauth/response', message);
                app.focus();
            });

            receiver.on('buy/redirect', () => {
                // It is enough to set focus to the Suite, the Suite should be on a page with info about the trade status,
                // if the user has not moved somewhere else in the Suite. This is a reasonable assumption
                // as the user was redirected from the Suite to the partner's site and is now coming back.
                app.focus({ steal: true });
            });

            receiver.on('sell/redirect', () => {
                // It is enough to set focus to the Suite, the Suite should be on a page with info about the trade status,
                // if the user has not moved somewhere else in the Suite. This is a reasonable assumption
                // as the user was redirected from the Suite to the partner's site and is now coming back.
                app.focus({ steal: true });
            });

            receiver.on('spend/message', event => {
                mainWindow.webContents.send('spend/message', event);
            });
        });

        app.on('before-quit', () => {
            logger.info(SERVICE_NAME, 'Stopping server (app quit)');
            receiver.stop();
        });

        // when httpReceiver was asked to provide current address for given pathname
        ipcMain.handle('server/request-address', (_, pathname) =>
            receiver.getRouteAddress(pathname),
        );

        logger.info(SERVICE_NAME, 'Starting server');
        await receiver.start();

        return receiver.getInfo();
    };
};
