// Captured IPC handlers registered by the module under test.
const ipcHandlers: Record<string, (...args: any[]) => any> = {};

jest.mock('../typed-electron', () => ({
    ipcMain: {
        handle: (channel: string, handler: (...args: any[]) => any) => {
            ipcHandlers[channel] = handler;
        },
    },
}));

(global as any).logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

import {
    addMessage,
    deleteMessage,
    initConnectPopupResponseHandler,
    rejectMessage,
} from '../libs/connect-popup-messages';

const respond = (response: unknown) => {
    const handler = ipcHandlers['connect-popup/response'];
    if (!handler) throw new Error('connect-popup/response handler not registered');

    return handler(undefined, response);
};

describe('connect-popup-messages', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        initConnectPopupResponseHandler();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    // Response deferreds are keyed by id. connect-ws namespaces the caller-supplied numeric id
    // per connection (`${connectionId}:${id}`), so two connections that reuse the same numeric
    // request id ("1") end up with distinct keys and MUST NOT cross-deliver. This is the
    // regression guard for the cross-client response-correlation issue.
    it('routes a response only to the deferred with the matching (namespaced) id', async () => {
        const victim = addMessage('ws-1:1');
        const attacker = addMessage('ws-2:1');

        let victimResolved = false;
        victim.promise.then(() => {
            victimResolved = true;
        });

        const attackerResponse = { id: 'ws-2:1', success: true, payload: 'ATTACKER_OWNED' };
        respond(attackerResponse);

        await expect(attacker.promise).resolves.toEqual(attackerResponse);
        // Flush any pending microtasks so a mistaken victim resolution would be observable.
        await Promise.resolve();
        expect(victimResolved).toBe(false);

        // Clean up the still-pending victim deferred.
        deleteMessage('ws-1:1');
    });

    it('ignores a response whose id has no registered deferred', () => {
        expect(() => respond({ id: 'ws-9:42', success: true, payload: 'x' })).not.toThrow();
    });

    it('ignores a malformed response without resolving anything', async () => {
        const pending = addMessage('ws-3:7');
        let resolved = false;
        pending.promise.then(() => {
            resolved = true;
        });

        expect(() => respond(undefined)).not.toThrow();
        expect(() => respond({ id: 123 })).not.toThrow();

        await Promise.resolve();
        expect(resolved).toBe(false);

        deleteMessage('ws-3:7');
    });

    it('rejectMessage settles the deferred so an awaiter unblocks', async () => {
        const pending = addMessage('ws-4:1');
        const error = new Error('Connection closed');

        rejectMessage('ws-4:1', error);

        await expect(pending.promise).rejects.toBe(error);
        // A subsequent response for the same id is a no-op (entry already removed).
        expect(() => respond({ id: 'ws-4:1', success: true, payload: 'x' })).not.toThrow();
    });

    it('rejectMessage is a no-op for an unknown id', () => {
        expect(() => rejectMessage('ws-nope:1', new Error('x'))).not.toThrow();
    });
});
