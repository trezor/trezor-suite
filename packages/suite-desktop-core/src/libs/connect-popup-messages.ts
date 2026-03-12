/**
 * Shared deferred message store for connect-popup responses.
 * Used by both connect-ws (WebSocket) and mcp-server (MCP) modules
 * to route responses from the renderer back to the correct caller.
 */
import type { ConnectPopupResponse } from '@trezor/suite-desktop-api/src/messages';
import { type Deferred, createDeferred } from '@trezor/utils';

import { ipcMain } from '../typed-electron';

const LOG_PREFIX = 'connect-popup-messages';

const messages: Record<string, Deferred<any>> = {};
let appInit: Deferred<void> | undefined;
let initialized = false;

const DEFERRED_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const addMessage = (id: string): Deferred<any> => {
    const deferred = createDeferred();
    messages[id] = deferred;

    const timer = setTimeout(() => {
        if (messages[id]) {
            delete messages[id];
            deferred.reject(new Error('connect-popup response timeout'));
        }
    }, DEFERRED_TIMEOUT_MS);

    deferred.promise.finally(() => clearTimeout(timer));

    return deferred;
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
        const success = (response as { success?: boolean })?.success;
        logger.info(
            LOG_PREFIX,
            `received response from popup (id=${response?.id}, success=${success})`,
        );

        if (!response || typeof response.id !== 'string') {
            logger.error(LOG_PREFIX, 'invalid response from popup');

            return;
        }

        const deferred = messages[response.id];
        if (!deferred) {
            logger.error(LOG_PREFIX, 'no deferred message found');

            return;
        }

        delete messages[response.id];
        deferred.resolve(response);
    });

    ipcMain.handle('connect-popup/ready', () => {
        appInit?.resolve();
    });
};
