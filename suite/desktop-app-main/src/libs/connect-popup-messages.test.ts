import {
    addMessage,
    initConnectPopupResponseHandler,
    rejectMessage,
} from './connect-popup-messages';
import { Logger } from './logger';

// Captured IPC handlers registered by the module under test.
const ipcHandlers: Record<string, (...args: any[]) => any> = {};

jest.mock('../ipcMain', () => ({
    ipcMain: {
        handle: (channel: string, handler: (...args: any[]) => any) => {
            ipcHandlers[channel] = handler;
        },
    },
}));

const logger = new Logger('mute');

const respond = (response: unknown) => {
    const handler = ipcHandlers['connect-popup/response'];
    if (!handler) throw new Error('connect-popup/response handler not registered');

    return handler(undefined, response);
};

describe('connect-popup-messages', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        initConnectPopupResponseHandler(logger);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('rejectMessage settles the deferred so an awaiter unblocks', async () => {
        const pending = addMessage('ws-1:1');
        const error = new Error('Connection closed');

        rejectMessage('ws-1:1', error);

        await expect(pending.promise).rejects.toBe(error);
        // A subsequent response for the same id is a no-op (entry already removed).
        expect(() => respond({ id: 'ws-1:1', success: true, payload: 'x' })).not.toThrow();
    });

    it('rejectMessage is a no-op for an unknown id', () => {
        expect(() => rejectMessage('ws-2:1', new Error('x'))).not.toThrow();
    });
});
