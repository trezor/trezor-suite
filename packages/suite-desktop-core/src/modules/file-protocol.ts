/**
 * Helps pointing to the right folder to load
 */
import { session } from 'electron';
import path from 'path';

import { APP_SRC, FILE_PROTOCOL } from '../libs/constants';

import type { ModuleInit } from './index';

export const SERVICE_NAME = 'file-protocol';

export const init: ModuleInit = ({ mainWindowProxy }) => {
    // Point to the right directory for file protocol requests
    session.defaultSession.protocol.interceptFileProtocol(FILE_PROTOCOL, (request, callback) => {
        let url = request.url.substring(FILE_PROTOCOL.length + 1);
        url = path.join(__dirname, '..', 'build', url);
        callback(url);
    });

    // Refresh if it failed to load
    mainWindowProxy.on('init', mainWindow => {
        mainWindow.webContents.on('did-fail-load', () => {
            mainWindow.loadURL(APP_SRC);
        });
    });
};
