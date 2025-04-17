/**
 * Local web server for handling requests to app
 */
import { validateIpcMessage } from '@trezor/ipc-proxy';

import { restartApp } from '../libs/app-utils';
import { exposeConnectWs } from '../libs/connect-ws';
import { createHttpReceiver } from '../libs/http-receiver';
import { hasSwitch } from '../libs/process-switches';
import { app, ipcMain } from '../typed-electron';

import type { ModuleInitBackground } from './index';

export const SERVICE_NAME = 'http-receiver';

export const initBackground: ModuleInitBackground = ({
    mainWindowProxy,
    mainThreadEmitter,
    store,
}) => {
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

            receiver.on('exchange/redirect', () => {
                // It is enough to set focus to the Suite, the Suite should be on a page with info about the trade status,
                // if the user has not moved somewhere else in the Suite. This is a reasonable assumption
                // as the user was redirected from the Suite to the partner's site and is now coming back.
                app.focus({ steal: true });
            });
        });

        // when httpReceiver was asked to provide current address for given pathname
        ipcMain.handle('server/request-address', (ipcEvent, pathname) => {
            validateIpcMessage(ipcEvent);
            try {
                const address = receiver.getRouteAddress(pathname);
                if (address) {
                    receiver.activateRoute(pathname);
                }

                return address;
            } catch (e) {
                logger.error(SERVICE_NAME, `Failed to get address: ${e.message}`);
            }
        });

        const connectPopupEnabled = () =>
            hasSwitch('expose-connect-ws') || store.getConnectSettings().enableWs;
        ipcMain.handle('connect-popup/enabled', ipcEvent => {
            validateIpcMessage(ipcEvent);

            return connectPopupEnabled();
        });
        ipcMain.handle('connect-popup/set-enabled', (ipcEvent, enabled: boolean) => {
            validateIpcMessage(ipcEvent);

            store.setConnectSettings({ enableWs: enabled });
            restartApp();
        });
        if (connectPopupEnabled()) {
            exposeConnectWs({ mainThreadEmitter, httpReceiver: receiver, mainWindowProxy });
        }

        logger.info(SERVICE_NAME, 'Starting server');

        const startResult = await receiver.start();
        if (!startResult.success) {
            // Don't fail hard if the server can't start
            logger.error(
                SERVICE_NAME,
                `Failed to start server:  ${startResult.error}, error details: ${startResult.message}`,
            );

            return { url: null };
        }

        return receiver.getInfo();
    };

    const onQuit = async () => {
        await httpReceiver?.stop();
    };

    return { onLoad, onQuit };
};
