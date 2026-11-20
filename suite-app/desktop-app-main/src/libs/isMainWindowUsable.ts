import { type BrowserWindow } from 'electron';

export const isMainWindowUsable = (
    mainWindow: BrowserWindow | undefined,
): mainWindow is BrowserWindow =>
    !!mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed();
