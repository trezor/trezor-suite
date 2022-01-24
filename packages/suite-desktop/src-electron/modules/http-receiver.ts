/**
 * Local web server for handling requests to app
 */
import { app, ipcMain } from '../typed-electron';
import { HttpReceiver } from '../libs/http-receiver';
import { Module } from './index';

// External request handler
const httpReceiver = new HttpReceiver();

const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    // wait for httpReceiver to start accepting connections then register event handlers
    httpReceiver.on('server/listening', () => {
        // when httpReceiver accepted oauth response
        httpReceiver.on('oauth/response', message => {
            mainWindow.webContents.send('oauth/response', message);
            app.focus();
        });

        httpReceiver.on('buy/redirect', () => {
            // It is enough to set focus to the Suite, the Suite should be on a page with info about the trade status,
            // if the user has not moved somewhere else in the Suite. This is a reasonable assumption
            // as the user was redirected from the Suite to the partner's site and is now coming back.
            app.focus({ steal: true });
        });

        httpReceiver.on('sell/redirect', () => {
            // It is enough to set focus to the Suite, the Suite should be on a page with info about the trade status,
            // if the user has not moved somewhere else in the Suite. This is a reasonable assumption
            // as the user was redirected from the Suite to the partner's site and is now coming back.
            app.focus({ steal: true });
        });

        httpReceiver.on('spend/message', event => {
            mainWindow.webContents.send('spend/message', event);
        });

        // when httpReceiver was asked to provide current address for given pathname
        ipcMain.handle('server/request-address', (_, pathname) =>
            httpReceiver.getRouteAddress(pathname),
        );
    });

    logger.info('http-receiver', 'Starting server');
    httpReceiver.start();
    app.on('before-quit', () => {
        logger.info('http-receiver', 'Stopping server (app quit)');
        httpReceiver.stop();
    });
};

export default init;
