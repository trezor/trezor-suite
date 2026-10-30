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

export type EnsureTransactionStoreDeps = GetTrezorConnectPrivilegedDep & {
    /** The SQLite worker; see `createTransactionStoreWorker`. */
    createWorker: () => Worker;
};

export type TransactionStoreService = {
    transactionStore: TransactionStore;
    /** Disposes the store, then ends its SQLite worker. */
    dispose: () => Promise<void>;
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

        return {
            transactionStore,
            dispose: async () => {
                // Cleared first, so a caller right after (a React remount) gets a fresh store.
                service = null;
                await transactionStore.dispose();
                sqlite.dispose();
                worker.terminate();
            },
        };
    };

    return () => {
        service ??= createService();

        return service;
    };
};
