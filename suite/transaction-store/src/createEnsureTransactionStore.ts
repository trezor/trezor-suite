import {
    type BlockchainLinkClient,
    type TransactionStore,
    createBlockchainLinkTransactionSource,
    createTransactionStoreCompositionRoot,
} from '@suite-common/transaction-store';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { GetTrezorConnectPrivilegedDep } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import { createWorkerSqlite } from './sqlite/createWorkerSqlite';

// Larger than a screen's page: walking a whole history takes fewer requests.
const PAGE_SIZE = 50;
// Enough for the pages, counts and states of the accounts someone clicks through.
const QUERY_CACHE_SIZE = 100;

export type EnsureTransactionStoreDeps = GetTrezorConnectPrivilegedDep & {
    /** The SQLite worker; see `createTransactionStoreWorker`. */
    createWorker: () => Worker;
};

/**
 * The last rows of each query, by its compiled form, as Evolu caches them: a list mounted again
 * shows them at once while its live query refreshes, instead of starting empty.
 */
export type TransactionStoreQueryCache = {
    get: (queryKey: string) => unknown[] | undefined;
    set: (queryKey: string, rows: unknown[]) => void;
};

export type TransactionStoreService = {
    transactionStore: TransactionStore;
    queryCache: TransactionStoreQueryCache;
    /** Disposes the store, then ends its SQLite worker. */
    dispose: () => Promise<void>;
    /**
     * Disposes the store and deletes its database from the device, then ends its SQLite worker;
     * for resetting the app. The next call starts on an empty database.
     */
    deleteDatabase: () => Promise<void>;
};

/**
 * The running store, started first when it is not: spawns its SQLite worker, and opens and
 * migrates the database. Nothing runs until something needs the store.
 */
export type EnsureTransactionStore = () => TransactionStoreService;

export type EnsureTransactionStoreDep = {
    ensureTransactionStore: EnsureTransactionStore;
};

export const injectEnsureTransactionStore = (services: any): EnsureTransactionStoreDep => ({
    ensureTransactionStore: services.ensureTransactionStore,
});

export const createEnsureTransactionStore = (
    deps: EnsureTransactionStoreDeps,
): EnsureTransactionStore => {
    let service: TransactionStoreService | null = null;

    const createQueryCache = (): TransactionStoreQueryCache => {
        // A `Map` keeps insertion order, so the first key is the least recently set.
        const rowsByQuery = new Map<string, unknown[]>();

        return {
            get: queryKey => rowsByQuery.get(queryKey),
            set: (queryKey, rows) => {
                rowsByQuery.delete(queryKey);
                rowsByQuery.set(queryKey, rows);
                if (rowsByQuery.size > QUERY_CACHE_SIZE) {
                    const [oldestKey] = rowsByQuery.keys();
                    if (oldestKey !== undefined) rowsByQuery.delete(oldestKey);
                }
            },
        };
    };

    /**
     * The app's Connect, on the backend the user chose; it holds the networks' connections, so
     * the store opens none of its own. By descriptor, it never involves the device.
     */
    const getBlockchainLink = (symbol: NetworkSymbol): BlockchainLinkClient => ({
        getAccountInfo: async params => {
            const response = await deps.getTrezorConnect().getAccountInfo({
                ...params,
                coin: asCoinSymbol(symbol),
                suppressBackupWarning: true,
            });
            // The source drops the message anyway; it may quote the descriptor.
            if (!response.success) throw new Error('Connect could not fetch the account');

            return response.payload;
        },
    });

    const createService = (): TransactionStoreService => {
        const worker = deps.createWorker();
        const sqlite = createWorkerSqlite(worker);
        const transactionStore = createTransactionStoreCompositionRoot({
            sqlite,
            transactionSource: createBlockchainLinkTransactionSource({
                getBlockchainLink,
                pageSize: PAGE_SIZE,
            }),
            now: () => Date.now(),
            onStartFailed: reason => {
                // Only the reason; nothing identifying the accounts.
                console.warn(`Transaction store did not start: ${reason}`);
            },
        });

        const stop = async (beforeEnd?: () => Promise<void>) => {
            // Cleared first, so a caller right after (a React remount) gets a fresh store.
            service = null;
            await transactionStore.dispose();
            await beforeEnd?.();
            sqlite.dispose();
            worker.terminate();
        };

        return {
            transactionStore,
            queryCache: createQueryCache(),
            dispose: () => stop(),
            deleteDatabase: () => stop(sqlite.deleteDatabase),
        };
    };

    return () => {
        service ??= createService();

        return service;
    };
};
