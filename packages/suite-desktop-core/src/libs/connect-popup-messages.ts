/**
 * Shared deferred message store for connect-popup responses.
 * Used by both connect-ws (WebSocket) and mcp-server (MCP) modules
 * to route responses from the renderer back to the correct caller.
 */
import { ConnectPopupResponse } from '@trezor/suite-desktop-api/src/messages';
import { Deferred, createDeferred } from '@trezor/utils';

import { ipcMain } from '../typed-electron';

const LOG_PREFIX = 'connect-popup-messages';

const messages: Record<string, Deferred<any, number>> = {};
let appInit: Deferred<void> | undefined;
let initialized = false;

export const addMessage = (id: string): Deferred<any, number> => {
    messages[id] = createDeferred();

    return messages[id];
};

export const hasMessage = (id: string) => !!messages[id];

export const deleteMessage = (id: string) => {
    delete messages[id];
};

export const setAppInit = (deferred: Deferred<void> | undefined) => {
    appInit = deferred;
};

export const getAppInit = () => appInit;

/**
 * Register the shared IPC handlers for connect-popup/response and connect-popup/ready.
 * Must be called exactly once, before any connect-popup calls are made.
 */
export const initConnectPopupResponseHandler = () => {
    if (initialized) return;
    initialized = true;

    const { logger } = global;

    ipcMain.handle('connect-popup/response', (_, response: ConnectPopupResponse) => {
        logger.info(LOG_PREFIX, 'received response from popup ' + JSON.stringify(response));
        if (!response || typeof response.id !== 'string') {
            logger.error(LOG_PREFIX, 'invalid response from popup');

            return;
        }

        if (!messages[response.id]) {
            logger.error(LOG_PREFIX, 'no deferred message found');

            return;
        }

        messages[response.id].resolve(response);
    });

    ipcMain.handle('connect-popup/ready', () => {
        appInit?.resolve();
    });
};
