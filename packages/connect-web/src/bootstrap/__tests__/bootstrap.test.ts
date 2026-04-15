/**
 * @jest-environment jsdom
 */

import { BootstrapError } from '../bootstrap-errors';

class MockBroadcastChannel {
    static instances: MockBroadcastChannel[] = [];
    name: string;
    private listeners: ((event: MessageEvent) => void)[] = [];
    postMessage = jest.fn();
    close = jest.fn();

    constructor(name: string) {
        this.name = name;
        MockBroadcastChannel.instances.push(this);
    }

    addEventListener(_type: string, listener: (event: MessageEvent) => void) {
        this.listeners.push(listener);
    }

    removeEventListener(_type: string, listener: (event: MessageEvent) => void) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    emit(data: any) {
        const event = new MessageEvent('message', { data });
        Object.defineProperty(event, 'currentTarget', { value: this });
        this.listeners.forEach(l => l(event));
    }
}

(global as any).BroadcastChannel = MockBroadcastChannel;

jest.useFakeTimers();

const setLocation = (url: string) => {
    Object.defineProperty(window, 'location', {
        value: { href: url, replace: jest.fn() },
        writable: true,
        configurable: true,
    });
};

beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.clearAllTimers();
    MockBroadcastChannel.instances = [];
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

    it('creates BroadcastChannel and redirects on successful handshake', async () => {
        const promise = bootstrap();

        const bc = MockBroadcastChannel.instances[0];
        expect(bc).toBeDefined();
        expect(bc.name).toBe('@trezor/connect-popup/abc123');

        // Bootstrap-iframe sends handshake request via BroadcastChannel.
        bc.emit({
            type: 'channel-handshake-request',
            channel: {
                here: '@trezor/connect-bootstrap-iframe',
                peer: '@trezor/connect-bootstrap-popup',
            },
        });

        await promise;

        // Confirm was sent back.
        expect(bc.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'channel-handshake-confirm',
                channel: {
                    here: '@trezor/connect-bootstrap-popup',
                    peer: '@trezor/connect-bootstrap-iframe',
                },
            }),
        );

        // BroadcastChannel closed after successful handshake.
        expect(bc.close).toHaveBeenCalled();

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

    it('redirects with broadcast-channel-not-supported error on BC failure', async () => {
        const original = (global as any).BroadcastChannel;
        delete (global as any).BroadcastChannel;

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
        (global as any).BroadcastChannel = original;
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

        (document as any).requestStorageAccess = jest.fn();

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
        const fakeBc = new MockBroadcastChannel('test');
        (document as any).requestStorageAccess = jest.fn().mockResolvedValue({
            BroadcastChannel: () => fakeBc,
        });

        const promise = bootstrap();
        startHandshake();

        await jest.advanceTimersByTimeAsync(0);

        // Bootstrap-popup confirms via BroadcastChannel.
        fakeBc.emit({
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

    it('handles requestStorageAccess failure', async () => {
        (document as any).requestStorageAccess = jest.fn().mockRejectedValue(new Error('denied'));

        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        bootstrap();
        startHandshake();

        await jest.advanceTimersByTimeAsync(0);

        errorSpy.mockRestore();
    });

    it('retries and eventually fails when bootstrap-popup does not respond', async () => {
        const fakeBc = new MockBroadcastChannel('test');
        (document as any).requestStorageAccess = jest.fn().mockResolvedValue({
            BroadcastChannel: () => fakeBc,
        });

        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        bootstrap();
        startHandshake();

        await jest.advanceTimersByTimeAsync(0);

        // Exhaust all 5 retry attempts (500ms each).
        jest.advanceTimersByTime(500 * 5);

        await jest.advanceTimersByTimeAsync(0);

        expect(errorSpy.mock.calls[0].join(' ')).toMatch('handshake-timeout');
        expect(fakeBc.close).toHaveBeenCalled();

        errorSpy.mockRestore();
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
