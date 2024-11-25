/**
 * Local web server for handling requests to app
 */
import { validateIpcMessage } from '@trezor/ipc-proxy';
import { isDevEnv } from '@suite-common/suite-utils';

import { app, ipcMain } from '../typed-electron';
import { createHttpReceiver } from '../libs/http-receiver';
import { exposeConnectWs } from '../libs/connect-ws';

import type { ModuleInitBackground } from './index';

export const SERVICE_NAME = 'http-receiver';

export const initBackground: ModuleInitBackground = ({ mainWindowProxy, mainThreadEmitter }) => {
    const { logger } = global;
    let httpReceiver: ReturnType<typeof createHttpReceiver> | null = null;

    const onLoad = async () => {
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
                mainWindowProxy.getInstance()?.webContents.send('oauth/response', message);
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
        });

        // when httpReceiver was asked to provide current address for given pathname
        ipcMain.handle('server/request-address', (ipcEvent, pathname) => {
            validateIpcMessage(ipcEvent);

            return receiver.getRouteAddress(pathname);
        });

        const connectPopupEnabled = app.commandLine.hasSwitch('expose-connect-ws') || isDevEnv;
        ipcMain.handle('connect-popup/enabled', ipcEvent => {
            validateIpcMessage(ipcEvent);

            return connectPopupEnabled;
        });
        if (connectPopupEnabled) {
            exposeConnectWs({ mainThreadEmitter, httpReceiver: receiver, mainWindowProxy });
        }

        logger.info(SERVICE_NAME, 'Starting server');

        try {
            await receiver.start();

            return receiver.getInfo();
        } catch (error) {
            // Don't fail hard if the server can't start
            logger.error(SERVICE_NAME, 'Failed to start server: ' + error);

            return { url: null };
        }
    };

    const onQuit = async () => {
        await httpReceiver?.stop();
    };

    return { onLoad, onQuit };
};
