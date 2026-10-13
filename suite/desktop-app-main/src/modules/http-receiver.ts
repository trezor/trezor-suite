/**
 * Local web server for handling requests to app
 */
import { captureMessage } from '@sentry/electron/main';

import { isMacOs, isWindows } from '@trezor/env-utils';
import { isArrayMember } from '@trezor/utils';

import { ipcMain } from '../ipcMain';
import { type MessageSystemGate } from './message-system';
import { type ModuleInitBackground } from './module';
import { restartApp } from '../libs/app-utils';
import { initConnectPopupResponseHandler } from '../libs/connect-popup-messages';
import { exposeConnectWs } from '../libs/connect-ws';
import { createHttpReceiver } from '../libs/http-receiver';
import { app } from '../typed-electron';

export const SERVICE_NAME = 'http-receiver';

export const TRADING_REDIRECT_PATHS = [
    '/buy-redirect',
    '/sell-redirect',
    '/exchange-redirect',
] as const;

type HttpReceiver = ReturnType<typeof createHttpReceiver>;

export const initBackground: ModuleInitBackground = ({
    mainWindowProxy,
    mainThreadEmitter,
    store,
    messageSystem,
    logger,
}) => {
    let httpReceiver: HttpReceiver | null = null;

    // Stopping the server drops every listener it has, so they are registered again on each start.
    const registerReceiverEvents = (receiver: HttpReceiver) => {
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
    };

    const startServer = async (receiver: HttpReceiver) => {
        registerReceiverEvents(receiver);

        logger.info(SERVICE_NAME, 'Starting server');

        const startResult = await receiver.start();
        if (!startResult.success) {
            // Don't fail hard if the server can't start
            logger.error(
                SERVICE_NAME,
                `Failed to start server:  ${startResult.error}, error details: ${startResult.message}`,
            );
            captureMessage(
                `http-receiver failed to start: ${startResult.error} (${startResult.message})`,
                'warning',
            );

            return { url: null };
        }

        return receiver.getInfo();
    };

    // A killswitch arriving from a later poll stops serving, and a config that drops it starts
    // the server again without an app restart.
    const applyGate = async (gate: MessageSystemGate) => {
        if (!httpReceiver) return;

        if (gate.isKillswitchActive) {
            logger.info(SERVICE_NAME, 'Stopping server, disabled by the message system');
            await httpReceiver.stop();

            return;
        }

        await startServer(httpReceiver);
    };

    const onLoad = () => {
        if (httpReceiver) {
            return httpReceiver.getInfo();
        }
        const connectPopupEnabled = () => !store.getConnectSettings().disableWs;

        // External request handler.
        // Note that if we override the `port` to something else than 21335, it might break google oauth
        const receiver = createHttpReceiver({
            logger,
            getStatus: () => ({
                appVersion: app.getVersion(),
                connectPopupWsEnabled: connectPopupEnabled(),
            }),
        });
        httpReceiver = receiver;

        // when httpReceiver was asked to provide current address for given pathname
        ipcMain.handle('server/request-address', (_, pathname) => {
            try {
                // Use deeplink URLs for trading redirects on macOS/Windows only
                if (isArrayMember(pathname, TRADING_REDIRECT_PATHS) && (isMacOs() || isWindows())) {
                    receiver.activateRoute(pathname);

                    return `trezorsuite:/${pathname}`;
                }

                const address = receiver.getRouteAddress(pathname);
                if (address) {
                    receiver.activateRoute(pathname);
                }

                return address;
            } catch (e) {
                logger.error(SERVICE_NAME, `Failed to get address: ${e.message}`);
            }
        });

        ipcMain.handle('connect-popup/enabled', () => connectPopupEnabled());
        ipcMain.handle('connect-popup/set-enabled', (_, enabled: boolean) => {
            store.setConnectSettings({ disableWs: !enabled });
            restartApp({ logger });
        });
        // Initialize the shared connect-popup response handler. This must be called
        // before any connect-popup calls are made, regardless of whether WS is enabled,
        // so that MCP and other transports can also use the connect-popup flow.
        initConnectPopupResponseHandler(logger);

        if (connectPopupEnabled()) {
            exposeConnectWs({
                mainThreadEmitter,
                httpReceiver: receiver,
                mainWindowProxy,
                store,
                messageSystem,
                logger,
            });
        }

        messageSystem.subscribe(gate => {
            applyGate(gate).catch(err =>
                logger.error(SERVICE_NAME, `Failed to apply the gate: ${err.message}`),
            );
        });

        if (messageSystem.getGate().isKillswitchActive) {
            logger.info(SERVICE_NAME, 'Not starting server, disabled by the message system');

            return { url: null };
        }

        return startServer(receiver);
    };

    const onQuit = async () => {
        await httpReceiver?.stop();
    };

    return { onLoad, onQuit };
};
