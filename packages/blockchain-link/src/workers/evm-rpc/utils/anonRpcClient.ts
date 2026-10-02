import type { AnonRpcWorker, RpcProvider } from '@anon-rpc/browser-harness';
import { createPublicClient, http } from 'viem';

import { CustomError } from '@trezor/blockchain-link-types';
import type { AnonRpcSettings } from '@trezor/blockchain-link-types';

export type AnonRpcLease = {
    fetch: typeof fetch;
    // Returns the shared client to the pool. Calling it more than once has no further effect.
    release: () => void;
};

export type AnonRpcClientPool = {
    acquire: (settings: AnonRpcSettings) => Promise<AnonRpcLease>;
};

type CreateAnonRpcClientPoolParams = {
    // How long a client nothing holds is kept, so a reconnect can pick it up again.
    idleCloseDelay: number;
};

type PooledClient = {
    worker: AnonRpcWorker;
    leases: number;
    isFailed: boolean;
    isClosed: boolean;
    idleTimer?: ReturnType<typeof setTimeout>;
    lastFetchError?: unknown;
};

type EthCallParams = [transaction: { to: `0x${string}`; data: `0x${string}` }, block: 'latest'];

const createBootstrapProvider = (bootstrapRpcUrl: string): RpcProvider => {
    const bootstrapClient = createPublicClient({ transport: http(bootstrapRpcUrl) });

    return {
        request: ({ method, params }) => {
            // The harness only needs this channel to read the specifier. Refusing anything else
            // keeps the one unanonymized channel from quietly carrying other traffic.
            if (method !== 'eth_call') {
                return Promise.reject(new CustomError('anon_rpc_bootstrap', `+${method}`));
            }

            return bootstrapClient.request({ method, params: params as EthCallParams });
        },
    };
};

// One client per anonymizing network, which the specifier and its config identify. The bootstrap
// endpoint is left out: it only locates the client's code, which the specifier pins by hash.
const getPoolKey = ({ specifier, config }: AnonRpcSettings) => JSON.stringify([specifier, config]);

export const createAnonRpcClientPool = ({
    idleCloseDelay,
}: CreateAnonRpcClientPoolParams): AnonRpcClientPool => {
    const clients = new Map<string, PooledClient>();

    const close = (key: string, client: PooledClient) => {
        if (client.isClosed) return;

        client.isClosed = true;
        clearTimeout(client.idleTimer);
        client.worker.close();
        if (clients.get(key) === client) clients.delete(key);
    };

    // A failed client never recovers, so it leaves the pool for the next acquire to replace, and is
    // closed as soon as nothing holds it.
    const markFailed = (key: string, client: PooledClient) => {
        client.isFailed = true;
        if (clients.get(key) === client) clients.delete(key);
        if (client.leases === 0) close(key, client);
    };

    const lease = (key: string, client: PooledClient): AnonRpcLease => {
        let isReleased = false;
        client.leases += 1;
        clearTimeout(client.idleTimer);

        return {
            fetch: async (input, init) => {
                try {
                    return await client.worker.fetch(input, init);
                } catch (error) {
                    // A dead client rethrows its one stored failure for every call, while each
                    // per-request error is a new object, so the same object twice means it is gone.
                    if (error === client.lastFetchError) markFailed(key, client);
                    client.lastFetchError = error;
                    throw error;
                }
            },
            release: () => {
                if (isReleased) return;

                isReleased = true;
                client.leases -= 1;
                if (client.leases > 0) return;

                if (client.isFailed) {
                    close(key, client);
                } else {
                    client.idleTimer = setTimeout(() => close(key, client), idleCloseDelay);
                }
            },
        };
    };

    return {
        acquire: async settings => {
            // The harness sandboxes the client in an iframe, so it needs a DOM, which Web Workers
            // and Node lack. Checking first also keeps the harness from loading where it cannot run.
            if (typeof document === 'undefined') {
                throw new CustomError('anon_rpc_unsupported');
            }

            const { AnonRpcWorker } = await import('@anon-rpc/browser-harness');

            const key = getPoolKey(settings);
            const pooled = clients.get(key);
            if (pooled) return lease(key, pooled);

            // Calls made before the client is ready are buffered rather than dropped, so `ready` is
            // not awaited. The connection probe's timeout bounds a client that never becomes ready.
            const client: PooledClient = {
                worker: new AnonRpcWorker({
                    address: settings.specifier,
                    config: settings.config,
                    preExisting: { rpcProvider: createBootstrapProvider(settings.bootstrapRpcUrl) },
                }),
                leases: 0,
                isFailed: false,
                isClosed: false,
            };
            clients.set(key, client);
            client.worker.ready.catch(() => markFailed(key, client));

            return lease(key, client);
        },
    };
};

// Upstream advises one long-lived client per network. Reconnecting releases and then re-acquires,
// so the grace period carries the client, and for Tor its circuits, across a reconnect.
export const anonRpcClientPool = createAnonRpcClientPool({ idleCloseDelay: 60_000 });
