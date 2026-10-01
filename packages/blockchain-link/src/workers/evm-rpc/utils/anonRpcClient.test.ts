import { AnonRpcWorker, type RpcProvider } from '@anon-rpc/browser-harness';

import type { AnonRpcSettings } from '@trezor/blockchain-link-types';

import { createAnonRpcClient } from './anonRpcClient';

jest.mock('@anon-rpc/browser-harness', () => ({ AnonRpcWorker: jest.fn() }));

const SETTINGS: AnonRpcSettings = {
    specifier: '0x4fd77be300f31c5fe6ab266d35d27750a3478d27',
    bootstrapRpcUrl: 'https://bootstrap.example/',
    config: { gateway: '127.0.0.1:1:certhash' },
};

const WORKER_HASH_RESULT = `0x${'ab'.repeat(32)}`;

const getBootstrapProvider = (): RpcProvider => {
    const [call] = jest.mocked(AnonRpcWorker).mock.calls;
    const provider = call?.[0].preExisting?.rpcProvider;
    if (!provider) throw new Error('harness was not given a bootstrap provider');

    return provider;
};

describe('createAnonRpcClient', () => {
    let directFetch: jest.SpyInstance;

    beforeEach(() => {
        jest.mocked(AnonRpcWorker).mockReset();
        Object.defineProperty(globalThis, 'document', { value: {}, configurable: true });

        directFetch = jest.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
            const { id } = JSON.parse(String(init?.body));

            return Promise.resolve(
                new Response(JSON.stringify({ jsonrpc: '2.0', id, result: WORKER_HASH_RESULT })),
            );
        });
    });

    afterEach(() => {
        Reflect.deleteProperty(globalThis, 'document');
        directFetch.mockRestore();
    });

    it('starts the harness for the configured specifier and client config', async () => {
        await createAnonRpcClient(SETTINGS);

        expect(AnonRpcWorker).toHaveBeenCalledWith(
            expect.objectContaining({ address: SETTINGS.specifier, config: SETTINGS.config }),
        );
    });

    it('reads the specifier through the bootstrap endpoint', async () => {
        await createAnonRpcClient(SETTINGS);
        const params = [{ to: SETTINGS.specifier, data: '0x12345678' }, 'latest'];

        const result = await getBootstrapProvider().request({ method: 'eth_call', params });

        expect(result).toBe(WORKER_HASH_RESULT);
        expect(directFetch).toHaveBeenCalledTimes(1);
        expect(directFetch).toHaveBeenCalledWith(SETTINGS.bootstrapRpcUrl, expect.anything());
    });

    it('refuses anything but eth_call over the bootstrap endpoint', async () => {
        await createAnonRpcClient(SETTINGS);

        await expect(
            getBootstrapProvider().request({ method: 'eth_sendRawTransaction', params: ['0x00'] }),
        ).rejects.toMatchObject({
            code: 'blockchain_link/anon_rpc_bootstrap',
            message: 'Unexpected bootstrap request: eth_sendRawTransaction',
        });

        expect(directFetch).not.toHaveBeenCalled();
    });

    it('refuses to start without a DOM', async () => {
        Reflect.deleteProperty(globalThis, 'document');

        await expect(createAnonRpcClient(SETTINGS)).rejects.toMatchObject({
            code: 'blockchain_link/anon_rpc_unsupported',
        });

        expect(AnonRpcWorker).not.toHaveBeenCalled();
    });
});
