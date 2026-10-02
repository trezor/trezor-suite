import { AnonRpcWorker, type RpcProvider } from '@anon-rpc/browser-harness';

import type { AnonRpcSettings } from '@trezor/blockchain-link-types';

import { createAnonRpcClientPool } from './anonRpcClient';

jest.mock('@anon-rpc/browser-harness', () => ({ AnonRpcWorker: jest.fn() }));

const SETTINGS: AnonRpcSettings = {
    specifier: '0x700dA3193D35fA54Cd3fBf29B66f2a2A0385659e',
    bootstrapRpcUrl: 'https://bootstrap.example/',
    config: { gateways: ['127.0.0.1:1:certhash'] },
};

const IDLE_CLOSE_DELAY = 1000;

const WORKER_HASH_RESULT = `0x${'ab'.repeat(32)}`;

type MockWorker = {
    fetch: jest.Mock;
    close: jest.Mock;
    ready: Promise<void>;
    failBoot: (error: Error) => void;
};

const createdWorkers: MockWorker[] = [];

const getCreatedWorker = (index: number) => {
    const worker = createdWorkers[index];
    if (!worker) throw new Error(`harness #${index} was never created`);

    return worker;
};

const mockWorker = (): MockWorker => {
    let failBoot: MockWorker['failBoot'] = () => {};
    const ready = new Promise<void>((_resolve, reject) => {
        failBoot = reject;
    });
    // The real harness absorbs its own rejection the same way.
    ready.catch(() => {});

    return { fetch: jest.fn(), close: jest.fn(), ready, failBoot };
};

const getBootstrapProvider = (): RpcProvider => {
    const [call] = jest.mocked(AnonRpcWorker).mock.calls;
    const provider = call?.[0].preExisting?.rpcProvider;
    if (!provider) throw new Error('harness was not given a bootstrap provider');

    return provider;
};

describe('anon-rpc client pool', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        createdWorkers.length = 0;
        jest.mocked(AnonRpcWorker).mockReset();
        jest.mocked(AnonRpcWorker).mockImplementation(() => {
            const worker = mockWorker();
            createdWorkers.push(worker);

            return worker as unknown as AnonRpcWorker;
        });
        Object.defineProperty(globalThis, 'document', { value: {}, configurable: true });
    });

    afterEach(() => {
        Reflect.deleteProperty(globalThis, 'document');
        jest.useRealTimers();
    });

    it('shares one client among connections to the same network', async () => {
        const pool = createAnonRpcClientPool({ idleCloseDelay: IDLE_CLOSE_DELAY });

        await pool.acquire(SETTINGS);
        await pool.acquire({ ...SETTINGS, bootstrapRpcUrl: 'https://other-bootstrap.example/' });

        expect(AnonRpcWorker).toHaveBeenCalledTimes(1);
        expect(AnonRpcWorker).toHaveBeenCalledWith(
            expect.objectContaining({ address: SETTINGS.specifier, config: SETTINGS.config }),
        );
    });

    it('starts a separate client for a different network', async () => {
        const pool = createAnonRpcClientPool({ idleCloseDelay: IDLE_CLOSE_DELAY });

        await pool.acquire(SETTINGS);
        await pool.acquire({ ...SETTINGS, config: { gateways: ['127.0.0.2:1:certhash'] } });

        expect(AnonRpcWorker).toHaveBeenCalledTimes(2);
    });

    it('closes a client only after it has been idle for the grace period', async () => {
        const pool = createAnonRpcClientPool({ idleCloseDelay: IDLE_CLOSE_DELAY });
        const first = await pool.acquire(SETTINGS);
        const second = await pool.acquire(SETTINGS);

        first.release();
        second.release();
        jest.advanceTimersByTime(IDLE_CLOSE_DELAY - 1);

        expect(getCreatedWorker(0).close).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);

        expect(getCreatedWorker(0).close).toHaveBeenCalledTimes(1);
    });

    it('keeps the client across a reconnect within the grace period', async () => {
        const pool = createAnonRpcClientPool({ idleCloseDelay: IDLE_CLOSE_DELAY });
        (await pool.acquire(SETTINGS)).release();

        await pool.acquire(SETTINGS);
        jest.advanceTimersByTime(IDLE_CLOSE_DELAY * 2);

        expect(AnonRpcWorker).toHaveBeenCalledTimes(1);
        expect(getCreatedWorker(0).close).not.toHaveBeenCalled();
    });

    it('ignores a repeated release', async () => {
        const pool = createAnonRpcClientPool({ idleCloseDelay: IDLE_CLOSE_DELAY });
        const first = await pool.acquire(SETTINGS);
        await pool.acquire(SETTINGS);

        first.release();
        first.release();
        jest.advanceTimersByTime(IDLE_CLOSE_DELAY);

        expect(getCreatedWorker(0).close).not.toHaveBeenCalled();
    });

    it('replaces a client that failed to boot', async () => {
        const pool = createAnonRpcClientPool({ idleCloseDelay: IDLE_CLOSE_DELAY });
        const lease = await pool.acquire(SETTINGS);
        const failed = getCreatedWorker(0);

        failed.failBoot(new Error('no resolver yielded bytes matching workerHash'));
        await failed.ready.catch(() => {});
        lease.release();

        expect(failed.close).toHaveBeenCalledTimes(1);

        await pool.acquire(SETTINGS);

        expect(AnonRpcWorker).toHaveBeenCalledTimes(2);
    });

    it('replaces a client that died after booting', async () => {
        const pool = createAnonRpcClientPool({ idleCloseDelay: IDLE_CLOSE_DELAY });
        const lease = await pool.acquire(SETTINGS);
        const storedFailure = new Error('worker error: crashed');
        getCreatedWorker(0).fetch.mockRejectedValue(storedFailure);

        await expect(lease.fetch('https://rpc.example/')).rejects.toBe(storedFailure);
        await expect(lease.fetch('https://rpc.example/')).rejects.toBe(storedFailure);
        await pool.acquire(SETTINGS);

        expect(AnonRpcWorker).toHaveBeenCalledTimes(2);
    });

    it('keeps a client whose individual requests fail', async () => {
        const pool = createAnonRpcClientPool({ idleCloseDelay: IDLE_CLOSE_DELAY });
        const lease = await pool.acquire(SETTINGS);
        getCreatedWorker(0).fetch.mockImplementation(() => Promise.reject(new Error('timeout')));

        await expect(lease.fetch('https://rpc.example/')).rejects.toThrow('timeout');
        await expect(lease.fetch('https://rpc.example/')).rejects.toThrow('timeout');
        await pool.acquire(SETTINGS);

        expect(AnonRpcWorker).toHaveBeenCalledTimes(1);
    });

    it('refuses to start without a DOM', async () => {
        Reflect.deleteProperty(globalThis, 'document');
        const pool = createAnonRpcClientPool({ idleCloseDelay: IDLE_CLOSE_DELAY });

        await expect(pool.acquire(SETTINGS)).rejects.toMatchObject({
            code: 'blockchain_link/anon_rpc_unsupported',
        });

        expect(AnonRpcWorker).not.toHaveBeenCalled();
    });

    describe('bootstrap endpoint', () => {
        let directFetch: jest.SpyInstance;

        beforeEach(() => {
            directFetch = jest.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
                const { id } = JSON.parse(String(init?.body));

                return Promise.resolve(
                    new Response(
                        JSON.stringify({ jsonrpc: '2.0', id, result: WORKER_HASH_RESULT }),
                    ),
                );
            });
        });

        afterEach(() => {
            directFetch.mockRestore();
        });

        it('reads the specifier through the bootstrap endpoint', async () => {
            jest.useRealTimers();
            await createAnonRpcClientPool({ idleCloseDelay: IDLE_CLOSE_DELAY }).acquire(SETTINGS);
            const params = [{ to: SETTINGS.specifier, data: '0x12345678' }, 'latest'];

            const result = await getBootstrapProvider().request({ method: 'eth_call', params });

            expect(result).toBe(WORKER_HASH_RESULT);
            expect(directFetch).toHaveBeenCalledTimes(1);
            expect(directFetch).toHaveBeenCalledWith(SETTINGS.bootstrapRpcUrl, expect.anything());
        });

        it('refuses anything but eth_call', async () => {
            await createAnonRpcClientPool({ idleCloseDelay: IDLE_CLOSE_DELAY }).acquire(SETTINGS);

            await expect(
                getBootstrapProvider().request({
                    method: 'eth_sendRawTransaction',
                    params: ['0x00'],
                }),
            ).rejects.toMatchObject({
                code: 'blockchain_link/anon_rpc_bootstrap',
                message: 'Unexpected bootstrap request: eth_sendRawTransaction',
            });

            expect(directFetch).not.toHaveBeenCalled();
        });
    });
});
