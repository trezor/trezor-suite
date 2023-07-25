/**
 * Helps pointing to the right folder to load
 */
import path from 'path';
import { session } from 'electron';

import { FILE_PROTOCOL, APP_SRC } from '../libs/constants';

import type { Module } from './index';

export const SERVICE_NAME = 'file-protocol';

export const init: Module = ({ mainWindow }) => {
    // Point to the right directory for file protocol requests
    session.defaultSession.protocol.interceptFileProtocol(FILE_PROTOCOL, (request, callback) => {
        let url = request.url.substring(FILE_PROTOCOL.length + 1);
        url = path.join(__dirname, '..', 'build', url);
        callback(url);
    });

    // Refresh if it failed to load
    mainWindow.webContents.on('did-fail-load', () => {
        mainWindow.loadURL(APP_SRC);
    });
};
