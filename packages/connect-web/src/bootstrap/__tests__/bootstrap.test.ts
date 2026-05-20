/**
 * @jest-environment jsdom
 */

import { BootstrapError } from '../bootstrap-errors';

class MockSharedWorkerPort {
    private listeners: ((event: MessageEvent) => void)[] = [];
    postMessage = jest.fn();
    close = jest.fn();
    start = jest.fn();

    addEventListener(_type: string, listener: (event: MessageEvent) => void) {
        this.listeners.push(listener);
    }

    removeEventListener(_type: string, listener: (event: MessageEvent) => void) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    emit(data: any) {
        const event = new MessageEvent('message', { data });
        this.listeners.forEach(l => l(event));
    }
}

class MockSharedWorker {
    static instances: MockSharedWorker[] = [];
    port: MockSharedWorkerPort;

    constructor(_url: string, _options?: { name?: string }) {
        this.port = new MockSharedWorkerPort();
        MockSharedWorker.instances.push(this);
    }
}

(global as any).SharedWorker = MockSharedWorker;

jest.useFakeTimers();

const setLocation = (url: string) => {
    Object.defineProperty(window, 'location', {
        value: { href: url, origin: 'https://suite.trezor.io', replace: jest.fn() },
        writable: true,
        configurable: true,
    });
};

beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.clearAllTimers();
    MockSharedWorker.instances = [];
});

const POPUP_URL = 'https://suite.trezor.io/connect-popup/';
const OWNER_ORIGIN = 'https://thirdparty.example.com';

const startHandshake = (origin: string = OWNER_ORIGIN) => {
    window.dispatchEvent(
        new MessageEvent('message', {
            data: {
                type: 'channel-handshake-request',
                channel: {
                    here: '@trezor/connect-web',
                    peer: '@trezor/connect-bootstrap-iframe',
                },
            },
            origin,
        }),
    );
};

// In jsdom: window.parent === window → IFRAME_MODE = false → popup mode.
describe('bootstrap (popup mode)', () => {
    let bootstrap: () => Promise<void>;

    beforeEach(() => {
        setLocation(`${POPUP_URL}?connect-popup-req=abc123`);

        jest.isolateModules(() => {
            ({ bootstrap } = require('../bootstrap'));
        });
    });

    it('creates SharedWorker and redirects on successful handshake', async () => {
        const promise = bootstrap();

        const sw = MockSharedWorker.instances[0];
        expect(sw).toBeDefined();

        // Verify channel-join was sent
        expect(sw.port.postMessage).toHaveBeenCalledWith({
            type: 'channel-join',
            channelId: '@trezor/connect-popup/abc123',
        });

        // Bootstrap-iframe sends handshake request via SharedWorker.
        sw.port.emit({
            type: 'channel-handshake-request',
            channel: {
                here: '@trezor/connect-bootstrap-iframe',
                peer: '@trezor/connect-bootstrap-popup',
            },
        });

        await promise;

        // Confirm was sent back.
        expect(sw.port.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'channel-handshake-confirm',
                channel: {
                    here: '@trezor/connect-bootstrap-popup',
                    peer: '@trezor/connect-bootstrap-iframe',
                },
            }),
        );

        // channel-leave sent before redirect.
        expect(sw.port.postMessage).toHaveBeenCalledWith({ type: 'channel-leave' });

        // Port closed after successful handshake.
        expect(sw.port.close).toHaveBeenCalled();

        // Redirects to base URL preserving original query.
        jest.advanceTimersByTime(2000);
        expect(window.location.href).toContain('connect-popup-req=abc123');
        expect(window.location.href).not.toContain('connect-popup-err');
    });

    it('redirects with handshake-timeout error on handshake timeout', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const promise = bootstrap();

        // No peer responds — timeout fires.
        jest.advanceTimersByTime(5000);

        await promise;

        // Redirect is delayed by 2s.
        jest.advanceTimersByTime(2000);

        expect(window.location.href).toBe(
            `${POPUP_URL}?connect-popup-err=${BootstrapError.HANDSHAKE_TIMEOUT}`,
        );

        errorSpy.mockRestore();
    });

    it('redirects with env-not-supported error when SharedWorker is unavailable', async () => {
        const original = (global as any).SharedWorker;
        delete (global as any).SharedWorker;

        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        jest.isolateModules(() => {
            ({ bootstrap } = require('../bootstrap'));
        });

        await bootstrap();

        jest.advanceTimersByTime(2000);

        expect(window.location.href).toBe(
            `${POPUP_URL}?connect-popup-err=${BootstrapError.ENV_NOT_SUPPORTED}`,
        );

        errorSpy.mockRestore();
        (global as any).SharedWorker = original;
    });
});

describe('bootstrap (iframe mode)', () => {
    let bootstrap: () => Promise<void>;
    const registeredListeners: EventListener[] = [];

    const mockParentWindow = { postMessage: jest.fn(), origin: OWNER_ORIGIN };

    beforeEach(() => {
        setLocation(`${POPUP_URL}?connect-popup-req=abc123`);

        // Make window.parent !== window → IFRAME_MODE = true.
        Object.defineProperty(window, 'parent', {
            value: mockParentWindow,
            writable: true,
            configurable: true,
        });

        const origAdd = window.addEventListener.bind(window);
        jest.spyOn(window, 'addEventListener').mockImplementation(
            (type: string, listener: EventListenerOrEventListenerObject, ...rest: any[]) => {
                if (type === 'message') registeredListeners.push(listener as EventListener);
                origAdd(type, listener, ...rest);
            },
        );

        jest.isolateModules(() => {
            ({ bootstrap } = require('../bootstrap'));
        });
    });

    afterEach(() => {
        registeredListeners.forEach(l => window.removeEventListener('message', l));
        registeredListeners.length = 0;
        (window.addEventListener as jest.Mock)?.mockRestore?.();

        Object.defineProperty(window, 'parent', {
            value: window,
            writable: true,
            configurable: true,
        });
    });

    it('rejects handshake when origin is missing', async () => {
        bootstrap();
        startHandshake('null');

        await jest.advanceTimersByTimeAsync(0);

        expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
            { type: 'channel-handshake-error', error: 'origin-missing' },
            '*',
        );
    });

    it('completes full handshake flow and starts forwarding', async () => {
        const promise = bootstrap();
        startHandshake();

        await jest.advanceTimersByTimeAsync(0);

        const sw = MockSharedWorker.instances[0];
        expect(sw).toBeDefined();

        // Verify channel-join was sent
        expect(sw.port.postMessage).toHaveBeenCalledWith({
            type: 'channel-join',
            channelId: '@trezor/connect-popup/abc123',
        });

        // Bootstrap-popup confirms via SharedWorker.
        sw.port.emit({
            type: 'channel-handshake-confirm',
            channel: {
                here: '@trezor/connect-bootstrap-popup',
                peer: '@trezor/connect-bootstrap-iframe',
            },
        });

        await promise;

        // Owner handshake confirmed to 3rd-party host via window.parent.
        expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'channel-handshake-confirm' }),
            OWNER_ORIGIN,
        );
    });

    it('retries and eventually fails when bootstrap-popup does not respond', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        bootstrap();
        startHandshake();

        await jest.advanceTimersByTimeAsync(0);

        // Exhaust all 5 retry attempts (500ms each).
        jest.advanceTimersByTime(500 * 5);

        await jest.advanceTimersByTimeAsync(0);

        expect(errorSpy.mock.calls[0].join(' ')).toMatch('handshake-timeout');

        const sw = MockSharedWorker.instances[0];
        expect(sw.port.postMessage).toHaveBeenCalledWith({ type: 'channel-leave' });
        expect(sw.port.close).toHaveBeenCalled();

        errorSpy.mockRestore();
    });

    it('forwards peer-disconnected to owner as popup-closed', async () => {
        const promise = bootstrap();
        startHandshake();

        await jest.advanceTimersByTimeAsync(0);

        const sw = MockSharedWorker.instances[0];

        // Complete handshake first.
        sw.port.emit({
            type: 'channel-handshake-confirm',
            channel: {
                here: '@trezor/connect-bootstrap-popup',
                peer: '@trezor/connect-bootstrap-iframe',
            },
        });

        await promise;

        // Simulate peer disconnection from worker.
        sw.port.emit({ type: 'peer-disconnected' });

        expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
            {
                type: 'popup-closed',
                channel: {
                    here: '@trezor/connect-popup',
                    peer: '@trezor/connect-web',
                },
            },
            OWNER_ORIGIN,
        );
    });
});

describe('bootstrap (getParams failures)', () => {
    let bootstrap: () => Promise<void>;

    it('throws when URLSearchParams is undefined', async () => {
        setLocation(POPUP_URL);

        const original = (global as any).URLSearchParams;
        delete (global as any).URLSearchParams;

        jest.isolateModules(() => {
            ({ bootstrap } = require('../bootstrap'));
        });

        bootstrap();
        startHandshake();

        await jest.advanceTimersByTimeAsync(0);

        expect(window.location.href).toBe(
            `${POPUP_URL}?connect-popup-err=${BootstrapError.ENV_NOT_SUPPORTED}`,
        );

        (global as any).URLSearchParams = original;
    });

    it('redirects with channel-id-missing error when channelId is absent', async () => {
        setLocation(POPUP_URL);

        jest.isolateModules(() => {
            ({ bootstrap } = require('../bootstrap'));
        });

        bootstrap();
        startHandshake();

        await jest.advanceTimersByTimeAsync(0);

        expect(window.location.href).toBe(
            `${POPUP_URL}?connect-popup-err=${BootstrapError.CHANNEL_ID_MISSING}`,
        );
    });
});
