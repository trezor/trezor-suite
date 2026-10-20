import { type IpcProxyHandlerOptions } from '@trezor/ipc-proxy';

import { mainThreadEmitter } from './module';
import { initBackground } from './trezor-connect';

const mockCreateIpcProxyHandler = jest.fn();
const mockTrezorConnect = {
    blockchainRegisterEvmNetwork: jest.fn(),
    blockchainEvmRpcGetChainId: jest.fn(),
    dispose: jest.fn(),
};

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: new Proxy(
        {},
        { get: (_, key) => mockTrezorConnect[key as keyof typeof mockTrezorConnect] },
    ),
    UI_EVENTS: {},
    UI_RESPONSE: {},
}));

jest.mock('@trezor/connect-common', () => ({ initLog: jest.fn() }));

jest.mock('@trezor/ipc-proxy', () => ({
    createIpcProxyHandler: (...args: unknown[]) => mockCreateIpcProxyHandler(...args),
}));

jest.mock('@trezor/transport', () => ({ NodeUsbTransport: jest.fn(), UdpTransport: jest.fn() }));
jest.mock('@trezor/transport-common', () => ({ BridgeTransport: jest.fn() }));
jest.mock('./bluetooth', () => ({ bluetoothModuleState: { getTransport: jest.fn() } }));
jest.mock('./firmware', () => ({ getStoredFirmwares: jest.fn() }));
jest.mock('../ipcMain', () => ({ looselyTypedIpcMain: {} }));
jest.mock('../libs/info', () => ({ getComputerName: jest.fn() }));
jest.mock('../libs/process-switches', () => ({ getSwitchValue: jest.fn() }));

const callRequest = (method: string, ...params: unknown[]) => {
    initBackground({
        mainThreadEmitter,
        store: {},
        powerSaveBlocker: {},
        logger: { debug: jest.fn(), info: jest.fn() },
    } as unknown as Parameters<typeof initBackground>[0]);

    const options: IpcProxyHandlerOptions<any> = mockCreateIpcProxyHandler.mock.calls[0][2];

    return (options.onCreateInstance as any)().onRequest(method, params);
};

describe('trezor-connect module request whitelisting', () => {
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
        mockTrezorConnect.blockchainRegisterEvmNetwork.mockResolvedValue({
            success: true,
            payload: { symbol: 'evm146' },
        });
        const params = {
            symbol: 'evm146',
            name: 'Sonic',
            chainId: 146,
            rpcUrls: ['https://rpc.soniclabs.com/path', 'wss://ws.soniclabs.com:8546'],
        };

        const result = await callRequest('blockchainRegisterEvmNetwork', params);

        expect(emitted).toEqual([
            {
                type: 'SET_WHITELISTED_DOMAINS_FOR_CUSTOM_BACKENDS',
                coin: 'evm146',
                domains: ['rpc.soniclabs.com', 'ws.soniclabs.com'],
            },
        ]);
        expect(mockTrezorConnect.blockchainRegisterEvmNetwork).toHaveBeenCalledWith(params);
        expect(result).toEqual({ success: true, payload: { symbol: 'evm146' } });
    });

    it('skips unparsable RPC URLs and leaves their rejection to the method', async () => {
        await callRequest('blockchainRegisterEvmNetwork', {
            symbol: 'evm146',
            rpcUrls: ['not a url', 'https://rpc.soniclabs.com'],
        });

        expect(emitted).toEqual([
            expect.objectContaining({ coin: 'evm146', domains: ['rpc.soniclabs.com'] }),
        ]);
        expect(mockTrezorConnect.blockchainRegisterEvmNetwork).toHaveBeenCalledTimes(1);
    });

    it('still whitelists a single host for the chain id check', async () => {
        await callRequest('blockchainEvmRpcGetChainId', { url: 'https://rpc.soniclabs.com' });

        expect(emitted).toEqual([{ type: 'ADD_WHITELISTED_DOMAIN', domain: 'rpc.soniclabs.com' }]);
    });
});
