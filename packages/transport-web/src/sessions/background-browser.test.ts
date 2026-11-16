import {
    type Descriptor,
    type HandleMessageParams,
    TRANSPORT_ERROR,
} from '@trezor/transport-common';

import { BrowserSessionsBackground } from './background-browser';

type PortListener = (event: MessageEvent<any>) => void;

/**
 * Minimal stand-in for the SharedWorker port: records registrations and lets a test
 * dispatch a response to whatever is currently attached.
 */
class MockMessagePort {
    private listeners: PortListener[] = [];
    readonly addEventListener = jest.fn((_type: string, listener: PortListener) => {
        this.listeners.push(listener);
    });
    readonly removeEventListener = jest.fn((_type: string, listener: PortListener) => {
        this.listeners = this.listeners.filter(l => l !== listener);
    });
    readonly postMessage = jest.fn();
    readonly start = jest.fn();
    readonly close = jest.fn();
    onmessageerror: ((event: MessageEvent<any>) => void) | null = null;

    get listenerCount() {
        return this.listeners.length;
    }

    emit(data: unknown) {
        [...this.listeners].forEach(listener => listener({ data } as MessageEvent<any>));
    }
}

let port: MockMessagePort;

beforeEach(() => {
    port = new MockMessagePort();
    (globalThis as any).SharedWorker = class {
        readonly port = port;
    };
});

describe('BrowserSessionsBackground', () => {
    test('off() removes one registration per call', () => {
        const background = new BrowserSessionsBackground('sessions-background.js');
        const listener = jest.fn();
        const descriptors: Descriptor[] = [];

        background.on('descriptors', listener);
        background.on('descriptors', listener);

        background.off('descriptors', listener);
        port.emit({ type: 'descriptors', payload: descriptors });
        // the same listener registered twice needs two off() calls, same as EventEmitter
        expect(listener).toHaveBeenCalledTimes(1);

        background.off('descriptors', listener);
        port.emit({ type: 'descriptors', payload: descriptors });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    test('dispose() settles in-flight requests instead of leaving them hanged', async () => {
        const background = new BrowserSessionsBackground('sessions-background.js');
        const params: HandleMessageParams = { type: 'handshake', id: 1 };

        const request = background.handleMessage(params);
        // no response arrives, the port listener is detached by dispose()
        background.dispose();

        await expect(request).resolves.toEqual({
            success: false,
            error: { code: TRANSPORT_ERROR.UNEXPECTED_ERROR },
            id: 1,
        });
    });

    test('dispose() detaches every tracked listener and closes the port', () => {
        const background = new BrowserSessionsBackground('sessions-background.js');
        background.on('descriptors', jest.fn());
        background.on('releaseRequest', jest.fn());
        void background.handleMessage({ type: 'handshake', id: 1 });

        background.dispose();

        expect(port.listenerCount).toBe(0);
        expect(port.removeEventListener).toHaveBeenCalledTimes(3);
        expect(port.close).toHaveBeenCalledTimes(1);
    });

    test('answered requests do not accumulate port listeners', async () => {
        const background = new BrowserSessionsBackground('sessions-background.js');

        for (let id = 1; id <= 15; id++) {
            const request = background.handleMessage({ type: 'handshake', id });
            port.emit({ success: true, payload: undefined, id });
            await expect(request).resolves.toEqual({ success: true, payload: undefined, id });
        }

        expect(port.listenerCount).toBe(0);
        expect(port.removeEventListener).toHaveBeenCalledTimes(15);

        // each answered request also dropped its entry from the tracked listeners, so dispose()
        // has nothing stale left to detach
        background.dispose();
        expect(port.removeEventListener).toHaveBeenCalledTimes(15);
        expect(port.close).toHaveBeenCalledTimes(1);
    });

    test('a request made after dispose() is answered instead of hanging on the closed port', async () => {
        const background = new BrowserSessionsBackground('sessions-background.js');
        background.dispose();

        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        background.on('descriptors', jest.fn());

        // nothing is registered on, or sent through, the closed port
        expect(port.listenerCount).toBe(0);
        expect(port.postMessage).not.toHaveBeenCalled();
        expect(consoleWarn).toHaveBeenCalledTimes(1);
        await expect(background.handleMessage({ type: 'handshake', id: 1 })).resolves.toEqual({
            success: false,
            error: { code: TRANSPORT_ERROR.UNEXPECTED_ERROR },
            id: 1,
        });

        consoleWarn.mockRestore();
    });
});
