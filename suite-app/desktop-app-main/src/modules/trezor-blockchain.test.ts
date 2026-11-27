import { type IpcProxyHandlerOptions } from '@trezor/ipc-proxy';

import { mainThreadEmitter } from './module';
import { initBackground } from './trezor-blockchain';

const mockCreateIpcProxyHandler = jest.fn();
const mockTrezorBlockchain = {
    updateSettings: jest.fn(),
    registerEvmNetwork: jest.fn(),
    evmRpcGetChainId: jest.fn(),
    dispose: jest.fn(),
};

// Read on use, as the mock factory runs before the module body defines the mock.
jest.mock('@trezor/blockchain-core', () => ({
    get TrezorBlockchain() {
        return mockTrezorBlockchain;
    },
}));

jest.mock('@trezor/ipc-proxy', () => ({
    createIpcProxyHandler: (...args: unknown[]) => mockCreateIpcProxyHandler(...args),
}));

jest.mock('../ipcMain', () => ({ looselyTypedIpcMain: {} }));
jest.mock('../libs/process-switches', () => ({ getSwitchValue: jest.fn() }));

const callRequest = (method: string, ...params: unknown[]) => {
    initBackground({
        mainThreadEmitter,
        store: { getTorSettings: () => ({ running: false }) },
        logger: { debug: jest.fn(), info: jest.fn() },
    } as unknown as Parameters<typeof initBackground>[0]);

    const options: IpcProxyHandlerOptions<any> = mockCreateIpcProxyHandler.mock.calls[0][2];

    return (options.onCreateInstance as any)().onRequest(method, params);
};

describe('trezor-blockchain module request whitelisting', () => {
    const emitted: unknown[] = [];

    beforeEach(() => {
        jest.clearAllMocks();
        emitted.length = 0;
        mainThreadEmitter.on('module/request-interceptor', event => emitted.push(event));
    });

    afterEach(() => {
        mainThreadEmitter.removeAllListeners();
    });

    it('whitelists the RPC hosts of a registered EVM network under its symbol', async () => {
        mockTrezorBlockchain.registerEvmNetwork.mockResolvedValue({
            success: true,
            payload: { symbol: 'evm146' },
        });
        const params = {
            symbol: 'evm146',
            name: 'Sonic',
            rpcUrls: ['https://rpc.soniclabs.com/path', 'wss://ws.soniclabs.com:8546'],
        };

        const result = await callRequest('registerEvmNetwork', params);

        expect(emitted).toEqual([
            {
                type: 'SET_WHITELISTED_DOMAINS_FOR_CUSTOM_BACKENDS',
                coin: 'evm146',
                domains: ['rpc.soniclabs.com', 'ws.soniclabs.com'],
            },
        ]);
        expect(mockTrezorBlockchain.registerEvmNetwork).toHaveBeenCalledWith(params);
        expect(result).toEqual({ success: true, payload: { symbol: 'evm146' } });
    });

    it('skips unparsable RPC URLs and leaves their rejection to the method', async () => {
        await callRequest('registerEvmNetwork', {
            symbol: 'evm146',
            rpcUrls: ['not a url', 'https://rpc.soniclabs.com'],
        });

        expect(emitted).toEqual([
            expect.objectContaining({ coin: 'evm146', domains: ['rpc.soniclabs.com'] }),
        ]);
        expect(mockTrezorBlockchain.registerEvmNetwork).toHaveBeenCalledTimes(1);
    });
});
