import { AnonRpcWorker } from '@anon-rpc/browser-harness';

import { MESSAGES } from '@trezor/blockchain-link-types';
import type { AnonRpcSettings, BlockchainSettings } from '@trezor/blockchain-link-types';

import type { AnonRpcClient } from './utils/anonRpcClient';

import { EvmRpcWorker } from './index';

jest.mock('@anon-rpc/browser-harness', () => ({ AnonRpcWorker: jest.fn() }));

const ANON_RPC: AnonRpcSettings = {
    specifier: '0x4fd77be300f31c5fe6ab266d35d27750a3478d27',
    bootstrapRpcUrl: 'https://bootstrap.example',
};

// Fails before anything is sent, so the worker's own error path is what gets exercised.
const UNREACHABLE_URL = 'http://localhost:1/';
const RPC_URL = 'https://rpc.example/';

type JsonRpcRequest = { id: number; method: string };

// Answers eth_chainId, or with a non-retryable JSON-RPC error for the unreachable endpoint so a
// failed probe does not wait out viem's retry backoff.
const respond = (url: string, init?: RequestInit) => {
    const { id }: JsonRpcRequest = JSON.parse(String(init?.body));
    const body = url.startsWith(UNREACHABLE_URL)
        ? { jsonrpc: '2.0', id, error: { code: -32601, message: 'unreachable' } }
        : { jsonrpc: '2.0', id, result: '0x1' };

    return Promise.resolve(new Response(JSON.stringify(body)));
};

const mockAnonRpcClient = (): jest.Mocked<AnonRpcClient> => ({
    fetch: jest.fn((input: RequestInfo | URL, init?: RequestInit) => respond(String(input), init)),
    close: jest.fn(),
});

const createdClients: jest.Mocked<AnonRpcClient>[] = [];

const getCreatedClient = (index: number) => {
    const client = createdClients[index];
    if (!client) throw new Error(`anon-rpc client #${index} was never created`);

    return client;
};

const createWorker = async (settings: Partial<BlockchainSettings>) => {
    const worker = new EvmRpcWorker();
    await worker.messageHandler({
        data: {
            id: 0,
            type: MESSAGES.HANDSHAKE,
            settings: { name: 'ETH', worker: '', server: [RPC_URL], ...settings },
        },
    });

    return worker;
};

describe('EvmRpcWorker with anon-rpc', () => {
    let directFetch: jest.SpyInstance;

    beforeEach(() => {
        createdClients.length = 0;
        jest.mocked(AnonRpcWorker).mockReset();
        jest.mocked(AnonRpcWorker).mockImplementation(() => {
            const client = mockAnonRpcClient();
            createdClients.push(client);

            return client as unknown as AnonRpcWorker;
        });

        // The harness needs a DOM; only its presence is checked, the harness itself is mocked.
        Object.defineProperty(globalThis, 'document', { value: {}, configurable: true });

        directFetch = jest
            .spyOn(globalThis, 'fetch')
            .mockRejectedValue(new Error('unexpected direct fetch'));
    });

    afterEach(() => {
        Reflect.deleteProperty(globalThis, 'document');
        directFetch.mockRestore();
    });

    it('sends RPC traffic only through the anon-rpc client', async () => {
        const worker = await createWorker({ anonRpc: ANON_RPC });

        await worker.connect();

        expect(AnonRpcWorker).toHaveBeenCalledWith(
            expect.objectContaining({ address: ANON_RPC.specifier }),
        );
        expect(createdClients).toHaveLength(1);
        expect(getCreatedClient(0).fetch).toHaveBeenCalledWith(RPC_URL, expect.anything());
        expect(directFetch).not.toHaveBeenCalled();
    });

    it('refuses a socket endpoint instead of connecting unanonymized', async () => {
        const worker = await createWorker({ anonRpc: ANON_RPC, server: ['wss://rpc.example'] });

        await expect(worker.connect()).rejects.toThrow('All backends are down');

        expect(AnonRpcWorker).not.toHaveBeenCalled();
        expect(directFetch).not.toHaveBeenCalled();
    });

    it('closes the sandbox of a failed endpoint before trying the next one', async () => {
        const worker = await createWorker({
            anonRpc: ANON_RPC,
            server: [UNREACHABLE_URL, RPC_URL],
        });

        await worker.connect();

        expect(createdClients).toHaveLength(2);
        expect(getCreatedClient(0).fetch).toHaveBeenCalledWith(UNREACHABLE_URL, expect.anything());
        expect(getCreatedClient(0).close).toHaveBeenCalledTimes(1);
        expect(getCreatedClient(1).close).not.toHaveBeenCalled();
    });

    it('closes the sandbox when every endpoint fails', async () => {
        const worker = await createWorker({ anonRpc: ANON_RPC, server: [UNREACHABLE_URL] });

        await expect(worker.connect()).rejects.toThrow('All backends are down');

        expect(createdClients).toHaveLength(1);
        expect(getCreatedClient(0).close).toHaveBeenCalledTimes(1);
    });

    it('closes the sandbox on disconnect', async () => {
        const worker = await createWorker({ anonRpc: ANON_RPC });
        await worker.connect();

        worker.disconnect();

        expect(getCreatedClient(0).close).toHaveBeenCalledTimes(1);
    });

    it('fails closed outside a browser main thread', async () => {
        Reflect.deleteProperty(globalThis, 'document');
        const worker = await createWorker({ anonRpc: ANON_RPC });

        await expect(worker.connect()).rejects.toThrow('All backends are down');

        expect(AnonRpcWorker).not.toHaveBeenCalled();
        expect(directFetch).not.toHaveBeenCalled();
    });

    it('connects directly when anon-rpc is not configured', async () => {
        directFetch.mockImplementation(respond);
        const worker = await createWorker({});

        await worker.connect();

        expect(AnonRpcWorker).not.toHaveBeenCalled();
        expect(directFetch).toHaveBeenCalledWith(RPC_URL, expect.anything());
    });
});
