import { BrowserWindow, dialog } from 'electron';

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

export const hangDetect = (mainWindow: BrowserWindow): Promise<HandshakeResult> => {
    const { logger } = global;
    let timeout: ReturnType<typeof setTimeout>;

    return new Promise(resolve => {
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
            // always resolve repeated handshakes from renderer (e.g. Ctrl+R)
            ipcMain.handle('handshake/client', () => Promise.resolve());
            resolve('success');

            return Promise.resolve();
        });
        logger.debug('init', `Load URL (${APP_SRC})`);
        mainWindow.loadURL(APP_SRC);
    });
};
