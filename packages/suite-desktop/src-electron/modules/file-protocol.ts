/**
 * Helps pointing to the right folder to load
 */
import path from 'path';
import { session, BrowserWindow } from 'electron';

import { PROTOCOL } from '@lib/constants';

const init = (window: BrowserWindow, src: string) => {
    // Point to the right directory for file protocol requests
    session.defaultSession.protocol.interceptFileProtocol(PROTOCOL, (request, callback) => {
        let url = request.url.substr(PROTOCOL.length + 1);
        url = path.join(__dirname, '..', 'build', url);
        callback(url);
    });

    // Refresh if it failed to load
    window.webContents.on('did-fail-load', () => {
        window.loadURL(src);
    });
};

export default init;
