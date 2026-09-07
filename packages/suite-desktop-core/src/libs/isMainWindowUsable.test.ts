import { type BrowserWindow } from 'electron';

import { isMainWindowUsable } from './isMainWindowUsable';

type CreateMainWindowMockParams = {
    isDestroyed?: boolean;
    isWebContentsDestroyed?: boolean;
};

type MainWindowMock = Pick<BrowserWindow, 'isDestroyed' | 'webContents'>;

const createMainWindowMock = ({
    isDestroyed = false,
    isWebContentsDestroyed = false,
}: CreateMainWindowMockParams = {}): MainWindowMock => ({
    isDestroyed: () => isDestroyed,
    webContents: {
        isDestroyed: () => isWebContentsDestroyed,
    } as BrowserWindow['webContents'],
});

describe('isMainWindowUsable', () => {
    it('returns false for undefined window', () => {
        expect(isMainWindowUsable(undefined)).toBe(false);
    });

    it('returns false for destroyed window', () => {
        const mainWindow = createMainWindowMock({ isDestroyed: true });

        expect(isMainWindowUsable(mainWindow as BrowserWindow)).toBe(false);
    });

    it('returns false for destroyed webContents', () => {
        const mainWindow = createMainWindowMock({ isWebContentsDestroyed: true });

        expect(isMainWindowUsable(mainWindow as BrowserWindow)).toBe(false);
    });

    it('returns true for usable window', () => {
        const mainWindow = createMainWindowMock();

        expect(isMainWindowUsable(mainWindow as BrowserWindow)).toBe(true);
    });
});
