import { AnonRpcWorker } from '@anon-rpc/browser-harness';

import { MESSAGES } from '@trezor/blockchain-link-types';
import type { AnonRpcSettings, BlockchainSettings } from '@trezor/blockchain-link-types';

import { EvmRpcWorker } from './index';

jest.mock('@anon-rpc/browser-harness', () => ({ AnonRpcWorker: jest.fn() }));

// Matches the shared pool's grace period before an unused client is closed.
const IDLE_CLOSE_DELAY = 60_000;

// Clients are pooled per network for the whole module, so each test uses a network of its own.
let networkCount = 0;
const createAnonRpcSettings = (): AnonRpcSettings => {
    networkCount += 1;

    return {
        specifier: `0x${networkCount.toString(16).padStart(40, '0')}`,
        bootstrapRpcUrl: 'https://bootstrap.example',
    };
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

type MockAnonRpcClient = {
    fetch: jest.Mock;
    close: jest.Mock;
    ready: Promise<void>;
};

const mockAnonRpcClient = (): MockAnonRpcClient => ({
    fetch: jest.fn((input: RequestInfo | URL, init?: RequestInit) => respond(String(input), init)),
    close: jest.fn(),
    ready: new Promise(() => {}),
});

const createdClients: MockAnonRpcClient[] = [];

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
        // Advancing with real time keeps viem's own timeouts working.
        jest.useFakeTimers({ advanceTimers: true });
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
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('sends RPC traffic only through the anon-rpc client', async () => {
        const anonRpc = createAnonRpcSettings();
        const worker = await createWorker({ anonRpc });

        await worker.connect();

        expect(AnonRpcWorker).toHaveBeenCalledWith(
            expect.objectContaining({ address: anonRpc.specifier }),
        );
        expect(createdClients).toHaveLength(1);
        expect(getCreatedClient(0).fetch).toHaveBeenCalledWith(RPC_URL, expect.anything());
        expect(directFetch).not.toHaveBeenCalled();
    });

    it('refuses a socket endpoint instead of connecting unanonymized', async () => {
        const worker = await createWorker({
            anonRpc: createAnonRpcSettings(),
            server: ['wss://rpc.example'],
        });

        await expect(worker.connect()).rejects.toThrow('All backends are down');

        expect(AnonRpcWorker).not.toHaveBeenCalled();
        expect(directFetch).not.toHaveBeenCalled();
    });

    it('keeps the client when an endpoint fails, and tries the next endpoint through it', async () => {
        const worker = await createWorker({
            anonRpc: createAnonRpcSettings(),
            server: [UNREACHABLE_URL, RPC_URL],
        });

        await worker.connect();

        expect(createdClients).toHaveLength(1);
        expect(getCreatedClient(0).fetch).toHaveBeenCalledWith(UNREACHABLE_URL, expect.anything());
        expect(getCreatedClient(0).fetch).toHaveBeenCalledWith(RPC_URL, expect.anything());
        expect(getCreatedClient(0).close).not.toHaveBeenCalled();
    });

    it('lets go of the client when every endpoint fails', async () => {
        const worker = await createWorker({
            anonRpc: createAnonRpcSettings(),
            server: [UNREACHABLE_URL],
        });

        await expect(worker.connect()).rejects.toThrow('All backends are down');
        jest.advanceTimersByTime(IDLE_CLOSE_DELAY);

        expect(getCreatedClient(0).close).toHaveBeenCalledTimes(1);
    });

    it('lets go of the client on disconnect', async () => {
        const worker = await createWorker({ anonRpc: createAnonRpcSettings() });
        await worker.connect();

        worker.disconnect();
        jest.advanceTimersByTime(IDLE_CLOSE_DELAY);

        expect(getCreatedClient(0).close).toHaveBeenCalledTimes(1);
    });

    it('shares one client between connections to the same network', async () => {
        const anonRpc = createAnonRpcSettings();
        const first = await createWorker({ anonRpc });
        const second = await createWorker({ anonRpc });

        await first.connect();
        await second.connect();
        first.disconnect();
        jest.advanceTimersByTime(IDLE_CLOSE_DELAY);

        expect(createdClients).toHaveLength(1);
        expect(getCreatedClient(0).close).not.toHaveBeenCalled();
    });

    it('fails closed outside a browser main thread', async () => {
        Reflect.deleteProperty(globalThis, 'document');
        const worker = await createWorker({ anonRpc: createAnonRpcSettings() });

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
