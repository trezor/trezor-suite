const ipcHandlers: Record<string, (...args: any[]) => any> = {};

const mockIpcHandle = jest.fn((channel: string, handler: (...args: any[]) => any) => {
    ipcHandlers[channel] = handler;
});
jest.mock('../typed-electron', () => ({
    ipcMain: {
        handle: (channel: string, handler: (...args: any[]) => any) =>
            mockIpcHandle(channel, handler),
    },
}));

jest.mock('@trezor/ipc-proxy', () => ({
    validateIpcMessage: jest.fn(),
}));

const mockCaptureMessage = jest.fn();
jest.mock('@sentry/electron/main', () => ({
    captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
}));

(global as any).logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

import { init } from './request-filter';

// Without a listener the session interceptor lets every request through.
const createInterceptor = () => {
    let beforeRequestListener: BeforeRequestListener = () => undefined;
    const interceptor: RequestInterceptor = {
        onBeforeRequest: listener => {
            beforeRequestListener = listener;
        },
        offBeforeRequest: () => {},
    };

    return {
        interceptor,
        request: (
            url: string,
            resourceType: Electron.OnBeforeRequestListenerDetails['resourceType'] = 'webSocket',
        ) =>
            beforeRequestListener({ url, resourceType } as Electron.OnBeforeRequestListenerDetails),
    };
};

const setup = () => {
    const { interceptor, request } = createInterceptor();

    // The request filter reads only `interceptor` from its dependencies.
    init({ interceptor } as any);

    const setAllowedHostsHandler = ipcHandlers['contacts-relays/set-allowed-hosts'];
    if (!setAllowedHostsHandler) throw new Error('contacts relay allowlist handler not registered');

    return {
        request,
        setContactsRelayAllowedHosts: (hosts: unknown) => setAllowedHostsHandler({}, hosts),
    };
};

describe('request-filter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('allows hosts from the static allowlist', () => {
        const { request } = setup();

        expect(request('https://data.trezor.io/firmware')).toBeUndefined();
        expect(request('ws://127.0.0.1:7777')).toBeUndefined();
    });

    it('blocks a contacts relay host until the renderer admits it', () => {
        const { request, setContactsRelayAllowedHosts } = setup();

        expect(request('wss://relay.example.com')).toEqual({ cancel: true });

        setContactsRelayAllowedHosts(['relay.example.com']);

        expect(request('wss://relay.example.com')).toBeUndefined();
    });

    it('matches contacts relay hosts exactly, not as a domain suffix', () => {
        const { request, setContactsRelayAllowedHosts } = setup();

        setContactsRelayAllowedHosts(['example.com']);

        expect(request('wss://example.com')).toBeUndefined();
        expect(request('wss://relay.example.com')).toEqual({ cancel: true });
    });

    it('replaces the contacts relay hosts in full', () => {
        const { request, setContactsRelayAllowedHosts } = setup();

        setContactsRelayAllowedHosts(['a.example.com', 'b.example.com']);
        setContactsRelayAllowedHosts(['b.example.com']);

        expect(request('wss://a.example.com')).toEqual({ cancel: true });
        expect(request('wss://b.example.com')).toBeUndefined();
    });

    it('treats a malformed host list as empty and skips malformed entries', () => {
        const { request, setContactsRelayAllowedHosts } = setup();

        setContactsRelayAllowedHosts(['relay.example.com']);
        setContactsRelayAllowedHosts('relay.example.com');

        expect(request('wss://relay.example.com')).toEqual({ cancel: true });

        setContactsRelayAllowedHosts([1, '', 'relay.example.com']);

        expect(request('wss://relay.example.com')).toBeUndefined();
    });

    it('admits a contacts relay host for websocket handshakes only', () => {
        const { request, setContactsRelayAllowedHosts } = setup();

        setContactsRelayAllowedHosts(['relay.example.com']);

        expect(request('wss://relay.example.com', 'webSocket')).toBeUndefined();
        expect(request('https://relay.example.com/?d=1', 'xhr')).toEqual({ cancel: true });
        expect(request('https://relay.example.com/x.js', 'script')).toEqual({ cancel: true });
    });

    it('admits only bare lower-case hostnames', () => {
        const { request, setContactsRelayAllowedHosts } = setup();

        setContactsRelayAllowedHosts([
            'relay.example.com:443',
            'user@relay.example.com',
            'relay.example.com/path',
            'Relay.Example.com',
        ]);

        expect(global.logger.info).toHaveBeenCalledWith(
            'request-filter',
            'contacts relay allowlist set to 0 host(s)',
        );
        expect(request('wss://relay.example.com')).toEqual({ cancel: true });
    });

    it('caps the number of admitted contacts relay hosts', () => {
        const { request, setContactsRelayAllowedHosts } = setup();

        setContactsRelayAllowedHosts(
            Array.from({ length: 33 }, (_, index) => `relay${index}.example.com`),
        );

        expect(request('wss://relay31.example.com')).toBeUndefined();
        expect(request('wss://relay32.example.com')).toEqual({ cancel: true });
    });

    it('blocks a removed contacts relay host without reporting it', () => {
        const { request, setContactsRelayAllowedHosts } = setup();

        setContactsRelayAllowedHosts(['relay.example.com']);
        setContactsRelayAllowedHosts([]);

        expect(request('wss://relay.example.com')).toEqual({ cancel: true });
        expect(request('https://relay.example.com', 'xhr')).toEqual({ cancel: true });
        expect(mockCaptureMessage).not.toHaveBeenCalled();
        expect(global.logger.warn).not.toHaveBeenCalled();
    });

    it('keeps blocking when registering the relay allowlist handler fails', () => {
        const { interceptor, request } = createInterceptor();
        mockIpcHandle.mockImplementationOnce(() => {
            throw new Error('Attempted to register a second handler');
        });

        expect(() => init({ interceptor } as any)).toThrow();
        expect(request('https://evil.example.com', 'xhr')).toEqual({ cancel: true });
    });

    it('reports a blocked host that is not silently blocked', () => {
        const { request } = setup();

        expect(request('wss://relay.example.com')).toEqual({ cancel: true });
        expect(mockCaptureMessage).toHaveBeenCalledWith(
            'request-filter: relay.example.com',
            'warning',
        );
    });
});
