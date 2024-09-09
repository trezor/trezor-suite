import { BrowserWindow, dialog } from 'electron';

import { validateIpcMessage } from '@trezor/ipc-proxy';
import { ElectionIpcMainInvokeEvent } from '@trezor/ipc-proxy/src/proxy-handler';

import { ipcMain } from './typed-electron';
import { APP_SRC } from './libs/constants';

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

export const hangDetect = (mainWindow: BrowserWindow, statePatch?: Record<string, any>) => {
    const { logger } = global;
    const handshakeHandler = (ipcEvent: ElectionIpcMainInvokeEvent) => {
        validateIpcMessage(ipcEvent);

        return Promise.resolve({});
    };
    let timeout: ReturnType<typeof setTimeout>;

    const handshake = new Promise<HandshakeResult>(resolve => {
        const timeoutCallback = async () => {
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
        logger.debug('init', `Load URL (${APP_SRC})`);
        mainWindow.loadURL(APP_SRC);
    });
    const cleanup = () => {
        ipcMain.removeHandler('handshake/client', handshakeHandler);
    };

    return { handshake, cleanup };
};
