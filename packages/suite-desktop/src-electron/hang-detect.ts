import { BrowserWindow, dialog } from 'electron';
import { ipcMain } from './typed-electron';
import { APP_SRC } from './libs/constants';
import type { InvokeResult, HandshakeClient, HandshakeElectron } from '@trezor/suite-desktop-api';

const HANG_WAIT = 30000;

type HangResult =
    | {
          result: 'success';
          payload: HandshakeClient;
          handshake: (payload: InvokeResult<HandshakeElectron>) => void;
      }
    | {
          result: 'quit';
      }
    | {
          result: 'reload';
      };

const showDialog = async (mainWindow: BrowserWindow) => {
    const resp = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        message: 'The application seems to be hanging...',
        buttons: ['Wait', 'Quit', 'Clear cache & restart'],
    });
    return (['wait', 'quit', 'reload'] as const)[resp.response];
};

export const hangDetect = (mainWindow: BrowserWindow): Promise<HangResult> => {
    const { logger } = global;
    let timeout: ReturnType<typeof setTimeout>;

    return new Promise(resolve => {
        const timeoutCallback = async () => {
            const result = await showDialog(mainWindow);
            if (result === 'wait') {
                logger.info('hang-detect', 'Delaying check');
                timeout = setTimeout(timeoutCallback, HANG_WAIT);
            } else {
                resolve({ result });
            }
        };
        timeout = setTimeout(timeoutCallback, HANG_WAIT);
        ipcMain.handleOnce('handshake/client', (_, payload) => {
            clearTimeout(timeout);
            return new Promise(handshake => {
                resolve({ result: 'success', payload, handshake });
            });
        });
        logger.debug('init', `Load URL (${APP_SRC})`);
        mainWindow.loadURL(APP_SRC);
    });
};
