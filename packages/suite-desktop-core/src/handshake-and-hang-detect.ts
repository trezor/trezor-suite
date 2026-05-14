import { type BrowserWindow, dialog } from 'electron';

import { validateIpcMessage } from '@trezor/ipc-proxy';
import { type ElectronIpcMainInvokeEvent } from '@trezor/ipc-proxy/src/types';
import { type TimerId } from '@trezor/type-utils';

import { loadIndex } from './libs/loadIndex';
import { ipcMain } from './typed-electron';

const HANG_WAIT = 30000;

type HandshakeResult = 'success' | 'quit' | 'reload';

const showDialog = async (mainWindow: BrowserWindow) => {
    const resp = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        message: 'The application seems to be hanging...',
        buttons: ['Wait', 'Quit', 'Clear cache & restart'],
    });

    return (['wait', 'quit', 'reload'] as const)[resp.response];
};

type HandshakeAndHangDetectParams = {
    mainWindow: BrowserWindow;
    statePatch?: Record<string, any>;
};

/**
 * Sets up one-time listener for handshake from renderer process, and handles timeout if nothing is received.
 */
export const handshakeAndHangDetect = ({
    mainWindow,
    statePatch,
}: HandshakeAndHangDetectParams) => {
    const { logger } = global;
    const handshakeHandler = (ipcEvent: ElectronIpcMainInvokeEvent) => {
        validateIpcMessage({ ipcEvent });

        return Promise.resolve({});
    };
    let timeout: TimerId;

    const handshake = new Promise<HandshakeResult>(resolve => {
        const timeoutCallback = async () => {
            // if renderer process was killed during timeout, then do not invoke any renderer api
            if (mainWindow.isDestroyed()) return {};

            // TODO: what happen if handshake will be fired up after timeout?
            const result = await showDialog(mainWindow);
            if (result === 'wait') {
                logger.info('hang-detect', 'Delaying check');
                timeout = setTimeout(timeoutCallback, HANG_WAIT);
            } else {
                resolve(result);
            }
        };
        timeout = setTimeout(timeoutCallback, HANG_WAIT);
        ipcMain.handleOnce('handshake/client', () => {
            clearTimeout(timeout);
            try {
                // always resolve repeated handshakes from renderer (e.g. Ctrl+R)
                ipcMain.handle('handshake/client', handshakeHandler);
            } catch {
                // Ignored - handler already registered
            }
            resolve('success');

            return Promise.resolve({ statePatch });
        });
        loadIndex(mainWindow);
    });
    const cleanup = () => {
        ipcMain.removeHandler('handshake/client');
    };

    return { handshake, cleanup };
};
