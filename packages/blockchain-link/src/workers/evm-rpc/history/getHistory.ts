import type { PublicClient } from 'viem';

import type { Transaction } from '@trezor/blockchain-link-types';
import { isNotNullOrUndefined } from '@trezor/utils';

import { getBlockTimestamps } from './blockTime';
import { mapWithConcurrency } from './concurrency';
import { MAX_TX_CONCURRENCY } from './constants';
import { getNativeLogSources } from './nativeAsset';
import { type DescriptorHistory, type HistoryEntry, sortedEntries } from './state';
import { mapTransaction } from '../mappers/transaction';
import { getTokenMetadataMap } from '../tokens';
import { toHex } from '../utils/hex';

export const DEFAULT_PAGE_SIZE = 25;

type HistoryPage = {
    total: number;
    txids: string[];
    transactions?: Transaction[];
    page?: { index: number; size: number; total: number };
};

type GetHistoryPageParams = {
    client: PublicClient;
    history: DescriptorHistory;
    descriptor: string;
    page?: number;
    pageSize?: number;
    includeTransactions: boolean;
};

const fetchTransaction = async (client: PublicClient, entry: HistoryEntry) => {
    const hash = toHex(entry.txid);

    try {
        const [tx, receipt] = await Promise.all([
            client.getTransaction({ hash }),
            client.getTransactionReceipt({ hash }),
        ]);

        return tx ? { entry, tx, receipt } : undefined;
    } catch {
        // A transaction that cannot be read right now is better omitted from the page than allowed
        // to fail the whole request.
        return undefined;
    }
};

/**
 * Fetches and maps the given entries into blockchain-link transactions, pulling only the token
 * metadata and block timestamps those entries actually need.
 */
// A mined transaction never changes, and Suite re-reads page one on every refresh, so mapping it
// again would cost two requests per transaction for an answer already known. Keyed by descriptor
// too, because type and amount are told from that account's point of view.
const mappedCaches = new WeakMap<PublicClient, Map<string, Transaction>>();

const getMappedCache = (client: PublicClient) => {
    const existing = mappedCaches.get(client);
    if (existing) return existing;

    const cache = new Map<string, Transaction>();
    mappedCaches.set(client, cache);

    return cache;
};

const mappedKey = (descriptor: string, txid: string) =>
    `${descriptor.toLowerCase()}:${txid.toLowerCase()}`;

const mapMissingEntries = async ({
    client,
    descriptor,
    entries,
    cache,
}: {
    client: PublicClient;
    descriptor: string;
    entries: readonly HistoryEntry[];
    cache: Map<string, Transaction>;
}): Promise<void> => {
    if (!entries.length) return;

    const fetched = (
        await mapWithConcurrency(entries, MAX_TX_CONCURRENCY, entry =>
            fetchTransaction(client, entry),
        )
    ).filter(isNotNullOrUndefined);

    const nativeSources = await getNativeLogSources(client);
    const nativeAddresses = new Set(nativeSources.map(source => source.address.toLowerCase()));

    const contracts = [
        ...new Set(
            fetched.flatMap(({ receipt }) =>
                (receipt.logs ?? [])
                    .map(log => log.address.toLowerCase())
                    .filter(address => !nativeAddresses.has(address)),
            ),
        ),
    ].map(address => toHex(address));

    const [tokenMetadata, timestamps] = await Promise.all([
        getTokenMetadataMap(client, contracts),
        getBlockTimestamps(
            client,
            fetched
                .filter(({ entry }) => entry.blockTimestamp === undefined)
                .map(({ entry }) => entry.blockNumber),
        ),
    ]);

    fetched.forEach(({ entry, tx, receipt }) => {
        cache.set(
            mappedKey(descriptor, entry.txid),
            mapTransaction({
                tx,
                receipt,
                blockTime: entry.blockTimestamp ?? timestamps.get(entry.blockNumber) ?? 0,
                userAddress: descriptor,
                nativeSources,
                tokenMetadata,
            }),
        );
    });
};

export const mapEntries = async ({
    client,
    descriptor,
    entries,
}: {
    client: PublicClient;
    descriptor: string;
    entries: readonly HistoryEntry[];
}): Promise<Transaction[]> => {
    const cache = getMappedCache(client);
    const missing = entries.filter(entry => !cache.has(mappedKey(descriptor, entry.txid)));

    await mapMissingEntries({ client, descriptor, entries: missing, cache });

    return entries
        .map(entry => cache.get(mappedKey(descriptor, entry.txid)))
        .filter(isNotNullOrUndefined);
};

export const getHistoryPage = async ({
    client,
    history,
    descriptor,
    page,
    pageSize,
    includeTransactions,
}: GetHistoryPageParams): Promise<HistoryPage> => {
    const entries = sortedEntries(history);
    const size = pageSize && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
    // Blockbook pages are 1-based and Suite leaves `page` out for the first one.
    const index = page && page > 0 ? page : 1;
    const pageEntries = entries.slice((index - 1) * size, (index - 1) * size + size);

    const result: HistoryPage = {
        total: entries.length,
        txids: pageEntries.map(entry => entry.txid),
        page: {
            index,
            size,
            total: Math.max(1, Math.ceil(entries.length / size)),
        },
    };

    if (!includeTransactions || !pageEntries.length) {
        return result;
    }

    result.transactions = await mapEntries({ client, descriptor, entries: pageEntries });

    return result;
};
