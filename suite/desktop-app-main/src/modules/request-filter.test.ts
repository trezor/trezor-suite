import { init } from './request-filter';

type IpcHandler = (ipcEvent: never, hostname: unknown) => unknown;
type BeforeRequest = (details: { url: string }) => { cancel: boolean } | undefined;

const mockIpcHandlers = new Map<string, IpcHandler>();

jest.mock('electron', () => ({
    ipcMain: {
        handle: (channel: string, handler: IpcHandler) => {
            mockIpcHandlers.set(channel, handler);
        },
    },
}));

jest.mock('@sentry/electron/main', () => ({ captureMessage: jest.fn() }));

jest.mock('@trezor/ipc-proxy', () => ({
    validateIpcMessage: jest.fn(),
    isSenderFrameDestroyed: jest.fn(),
}));

const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const setUp = () => {
    let onBeforeRequest: BeforeRequest = () => undefined;
    init({
        logger,
        interceptor: {
            onBeforeRequest: (handler: BeforeRequest) => {
                onBeforeRequest = handler;
            },
        },
    } as never);

    const allowHost = mockIpcHandlers.get('request-filter/allow-chain-node-host');
    if (!allowHost) throw new Error('allow-chain-node-host handler was not registered');

    return {
        allowHost: (hostname: unknown) => allowHost({} as never, hostname),
        request: (url: string) => onBeforeRequest({ url }),
    };
};

describe('request-filter', () => {
    it('blocks a host that is not allowed', () => {
        const { request } = setUp();

        expect(request('https://rpc.example.com/')).toEqual({ cancel: true });
        expect(request('https://data.trezor.io/')).toBeUndefined();
    });

    it('allows a chain node once the renderer asks for it', () => {
        const { allowHost, request } = setUp();

        expect(allowHost('RPC.Example.com')).toEqual({ success: true });

        expect(request('https://rpc.example.com/v1/key')).toBeUndefined();
        expect(request('https://other.example.com/')).toEqual({ cancel: true });
    });

    it('refuses what is not a hostname', () => {
        const { allowHost, request } = setUp();

        expect(allowHost('https://rpc.example.com')).toEqual({
            success: false,
            error: 'invalid hostname',
        });
        expect(allowHost('com')).toEqual({ success: false, error: 'invalid hostname' });
        expect(allowHost(42)).toEqual({ success: false, error: 'invalid hostname' });
        expect(request('https://rpc.example.com/')).toEqual({ cancel: true });
    });
});
