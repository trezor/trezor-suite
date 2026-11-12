import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ipcMain as electronIpcMain } from 'electron';

import { isSenderFrameDestroyed, validateIpcMessage } from '@trezor/ipc-proxy';

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
    isSenderFrameDestroyed: jest.fn(),
}));

const createIpcEvent = (): IpcMainEvent =>
    ({
        senderFrame: { url: 'file:///build/index.html', isDestroyed: () => false },
    }) as unknown as IpcMainEvent;

const createIpcInvokeEvent = (): IpcMainInvokeEvent =>
    ({
        senderFrame: { url: 'file:///build/index.html', isDestroyed: () => false },
    }) as unknown as IpcMainInvokeEvent;

describe('ipcMain validation wrapper', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(isSenderFrameDestroyed).mockReturnValue(false);
    });

    it.each([
        { methodName: 'on', channel: 'theme/change' },
        { methodName: 'once', channel: 'theme/change' },
        // Electron defines 'addListener' as an alias for 'on', but Typescript behaves weirdly.
        { methodName: 'addListener' as 'on', channel: 'theme/change' },
    ] as const)(
        'validates sender before registering $methodName listeners',
        ({ methodName, channel }) => {
            const originalListener = jest.fn();
            const ipcEvent = createIpcEvent();

            ipcMain[methodName](channel, originalListener);

            const wrappedListener = jest.mocked(electronIpcMain[methodName]).mock.calls[0]?.[1];
            expect(wrappedListener).toBeDefined();

            if (wrappedListener === undefined) {
                throw new Error('wrappedListener is undefined');
            }

            wrappedListener(ipcEvent, 'dark');

            expect(isSenderFrameDestroyed).toHaveBeenCalledWith({ ipcEvent });
            expect(validateIpcMessage).toHaveBeenCalledWith({ ipcEvent });
            expect(originalListener).toHaveBeenCalledWith(ipcEvent, 'dark');
        },
    );

    it.each([
        { methodName: 'handle', channel: 'app/is-visible' },
        { methodName: 'handleOnce', channel: 'app/is-visible' },
    ] as const)(
        'validates sender before registering $methodName listeners and preserves return values',
        async ({ methodName, channel }) => {
            const originalListener = jest.fn().mockResolvedValue('result');
            const ipcEvent = createIpcInvokeEvent();

            ipcMain[methodName](channel, originalListener);

            const wrappedListener = jest.mocked(electronIpcMain[methodName]).mock.calls[0]?.[1];
            expect(wrappedListener).toBeDefined();

            if (wrappedListener === undefined) {
                throw new Error('wrappedListener is undefined');
            }

            await expect(wrappedListener(ipcEvent)).resolves.toBe('result');
            expect(isSenderFrameDestroyed).toHaveBeenCalledWith({ ipcEvent });
            expect(validateIpcMessage).toHaveBeenCalledWith({ ipcEvent });
            expect(originalListener).toHaveBeenCalledWith(ipcEvent);
        },
    );
});
