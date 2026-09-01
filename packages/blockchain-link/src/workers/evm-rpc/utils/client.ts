import { type PublicClient } from 'viem';

/**
 * Caches a read for the lifetime of the client. A client is created per connection, so an answer
 * cached here only has to hold for that one connection. A failed read is not cached.
 */
export const cachePerClient = <T>(
    cache: WeakMap<PublicClient, Promise<T>>,
    client: PublicClient,
    read: () => Promise<T>,
) => {
    const cached = cache.get(client);
    if (cached) return cached;

    const pending = read().catch(error => {
        cache.delete(client);
        throw error;
    });
    cache.set(client, pending);

    return pending;
};

// The chain cannot change under a connection.
const chainIds = new WeakMap<PublicClient, Promise<number>>();

export const getChainId = (client: PublicClient) =>
    cachePerClient(chainIds, client, () => client.getChainId());
