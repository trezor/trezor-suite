import type { PublicClient } from 'viem';

import { mapWithConcurrency } from './concurrency';
import { MAX_TX_CONCURRENCY } from './constants';

// Block timestamps never change, and a page of transactions routinely revisits the same blocks.
const timestampCaches = new WeakMap<PublicClient, Map<number, number>>();

const getTimestampCache = (client: PublicClient) => {
    const existing = timestampCaches.get(client);
    if (existing) return existing;

    const cache = new Map<number, number>();
    timestampCaches.set(client, cache);

    return cache;
};

export const getBlockTimestamps = async (
    client: PublicClient,
    blockNumbers: readonly number[],
): Promise<Map<number, number>> => {
    const cache = getTimestampCache(client);
    const missing = [...new Set(blockNumbers)].filter(blockNumber => !cache.has(blockNumber));

    await mapWithConcurrency(missing, MAX_TX_CONCURRENCY, async blockNumber => {
        try {
            const block = await client.getBlock({ blockNumber: BigInt(blockNumber) });
            cache.set(blockNumber, Number(block.timestamp));
        } catch {
            // A missing timestamp only costs the transaction its date, so leave it unset.
        }
    });

    return cache;
};
