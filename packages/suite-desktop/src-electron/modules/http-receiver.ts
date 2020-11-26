/**
 * Local web server for handling requests to app
 */
import { app, ipcMain, BrowserWindow } from 'electron';

import { buyRedirectHandler } from '@lib/buy';
import { HttpReceiver } from '@lib/http-receiver';

// External request handler
const httpReceiver = new HttpReceiver();

const init = (window: BrowserWindow, src: string) => {
    // wait for httpReceiver to start accepting connections then register event handlers
    httpReceiver.on('server/listening', () => {
        // when httpReceiver accepted oauth code
        httpReceiver.on('oauth/code', code => {
            window.webContents.send('oauth/code', code);
            app.focus();
        });

        httpReceiver.on('buy/redirect', url => {
            buyRedirectHandler(url, window, src);
        });

        // when httpReceiver was asked to provide current address for given pathname
        ipcMain.handle('server/request-address', (_event, pathname) =>
            httpReceiver.getRouteAddress(pathname),
        );
    });

    httpReceiver.start();
    app.on('before-quit', () => {
        httpReceiver.stop();
    });
};

export default init;
