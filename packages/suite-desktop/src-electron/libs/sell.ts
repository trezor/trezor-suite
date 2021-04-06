import { app, BrowserWindow } from 'electron';
import * as path from 'path';

export const sellRedirectHandler = (url: string, mainWindow: BrowserWindow, src: string) => {
    mainWindow.loadURL(
        path.join(
            src,
            url.replace('#', '').replace('coinmarket-redirect/', 'coinmarket-redirect#'),
        ),
    );

    app.focus({ steal: true });
};
