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
});
