import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ipcMain as electronIpcMain } from 'electron';

import { validateIpcMessage } from '@trezor/ipc-proxy';

import { ipcMain } from './ipcMain';

jest.mock('electron', () => ({
    app: {},
    ipcMain: {
        on: jest.fn(),
        once: jest.fn(),
        addListener: jest.fn(),
        handle: jest.fn(),
        handleOnce: jest.fn(),
    },
    ipcRenderer: {},
}));

jest.mock('@trezor/ipc-proxy', () => ({
    validateIpcMessage: jest.fn(),
}));

describe('typed-electron ipcMain validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('validates sender before registering on listeners', () => {
        const originalListener = jest.fn();
        const ipcEvent = {
            senderFrame: { url: 'file:///build/index.html', isDestroyed: () => false },
        } as unknown as IpcMainEvent;

        ipcMain.on('theme/change', originalListener);

        const wrappedListener = jest.mocked(electronIpcMain.on).mock.calls[0]?.[1];
        expect(wrappedListener).toBeDefined();
        if (wrappedListener === undefined) {
            throw new Error('wrappedListener is undefined');
        }
        wrappedListener(ipcEvent, 'dark');

        expect(validateIpcMessage).toHaveBeenCalledWith({ ipcEvent });
        expect(originalListener).toHaveBeenCalledWith(ipcEvent, 'dark');
    });

    it('validates sender before registering once listeners', () => {
        const originalListener = jest.fn();
        const ipcEvent = {
            senderFrame: { url: 'file:///build/index.html', isDestroyed: () => false },
        } as unknown as IpcMainEvent;

        ipcMain.once('theme/change', originalListener);

        const wrappedListener = jest.mocked(electronIpcMain.once).mock.calls[0]?.[1];
        expect(wrappedListener).toBeDefined();
        if (wrappedListener === undefined) {
            throw new Error('wrappedListener is undefined');
        }
        wrappedListener(ipcEvent, 'dark');

        expect(validateIpcMessage).toHaveBeenCalledWith({ ipcEvent });
        expect(originalListener).toHaveBeenCalledWith(ipcEvent, 'dark');
    });

    it('validates sender before registering addListener listeners', () => {
        const originalListener = jest.fn();
        const ipcEvent = {
            senderFrame: { url: 'file:///build/index.html', isDestroyed: () => false },
        } as unknown as IpcMainEvent;

        ipcMain.addListener('theme/change', originalListener);

        const wrappedListener = jest.mocked(electronIpcMain.addListener).mock.calls[0]?.[1];
        expect(wrappedListener).toBeDefined();
        if (wrappedListener === undefined) {
            throw new Error('wrappedListener is undefined');
        }
        wrappedListener(ipcEvent, 'dark');

        expect(validateIpcMessage).toHaveBeenCalledWith({ ipcEvent });
        expect(originalListener).toHaveBeenCalledWith(ipcEvent, 'dark');
    });

    it('validates sender before registering handle listeners and preserves return values', async () => {
        const originalListener = jest.fn().mockResolvedValue('result');
        const ipcEvent = {
            senderFrame: { url: 'file:///build/index.html', isDestroyed: () => false },
        } as unknown as IpcMainInvokeEvent;

        ipcMain.handle('app/is-visible', originalListener);

        const wrappedListener = jest.mocked(electronIpcMain.handle).mock.calls[0]?.[1];
        expect(wrappedListener).toBeDefined();
        if (wrappedListener === undefined) {
            throw new Error('wrappedListener is undefined');
        }
        await expect(wrappedListener(ipcEvent)).resolves.toBe('result');
        expect(validateIpcMessage).toHaveBeenCalledWith({ ipcEvent });
        expect(originalListener).toHaveBeenCalledWith(ipcEvent);
    });

    it('validates sender before registering handleOnce listeners and preserves return values', async () => {
        const originalListener = jest.fn().mockResolvedValue('result');
        const ipcEvent = {
            senderFrame: { url: 'file:///build/index.html', isDestroyed: () => false },
        } as unknown as IpcMainInvokeEvent;

        ipcMain.handleOnce('app/is-visible', originalListener);

        const wrappedListener = jest.mocked(electronIpcMain.handleOnce).mock.calls[0]?.[1];
        expect(wrappedListener).toBeDefined();
        if (wrappedListener === undefined) {
            throw new Error('wrappedListener is undefined');
        }
        await expect(wrappedListener(ipcEvent)).resolves.toBe('result');
        expect(validateIpcMessage).toHaveBeenCalledWith({ ipcEvent });
        expect(originalListener).toHaveBeenCalledWith(ipcEvent);
    });
});
