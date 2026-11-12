import { type FindResult } from '@suite/desktop-app-api';

import { ipcMain } from '../ipcMain';
import { type FindSession, continueFind, getFindResult, startFind, stopFind } from './findSession';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'find';

const clearedResult: FindResult = { matches: 0, activeMatchOrdinal: 0 };

// Chromium paints find matches itself. Wrapping them in DOM nodes makes React's
// next commit call removeChild on a node that is no longer a child.
export const init: ModuleInit = ({ mainWindowProxy }) => {
    let session: FindSession = { query: '', requestId: 0 };

    const onFoundInPage = (_event: Electron.Event, result: Electron.Result) => {
        const found = getFindResult(session, result);
        if (!found) return;

        mainWindowProxy.getInstance()?.webContents.send('find:result', found);
    };

    mainWindowProxy.on('init', mainWindow => {
        mainWindow.webContents.on('found-in-page', onFoundInPage);
    });

    mainWindowProxy.on('destroy', mainWindow => {
        mainWindow.webContents.removeListener('found-in-page', onFoundInPage);
    });

    ipcMain.on('find/query', (event, query) => {
        if (typeof query !== 'string') return;

        session = startFind(event.sender, query);
        if (session.requestId !== 0) return;

        event.sender.send('find:result', clearedResult);
    });

    ipcMain.on('find/next', event => {
        session = continueFind(session, event.sender, true);
    });

    ipcMain.on('find/previous', event => {
        session = continueFind(session, event.sender, false);
    });

    ipcMain.on('find/stop', event => {
        session = stopFind(event.sender);
        event.sender.send('find:result', clearedResult);
    });
};
