import {
    type TransactionStore,
    createTransactionStoreRpcClient,
} from '@suite-common/transaction-store';
import type { GetTrezorConnectPrivilegedDep } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import {
    type TransactionStoreWorkerCommands,
    type TransactionStoreWorkerEvents,
    createWorkerMessageHandler,
    toWorkerMessage,
} from './worker/transactionStoreWorkerProtocol';

export type EnsureTransactionStoreDeps = GetTrezorConnectPrivilegedDep & {
    createWorker: () => Worker;
};

export type TransactionStoreService = {
    transactionStore: TransactionStore;
    /** Disposes the store, then ends its worker. */
    dispose: () => Promise<void>;
};

/**
 * The running store, started first when it is not: spawns the worker, which opens and migrates the
 * database. Nothing runs until something needs the store.
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

    const createService = (): TransactionStoreService => {
        const worker = deps.createWorker();
        const transactionStore = createTransactionStoreRpcClient({
            port: worker,
        });
        const handleEvent = createWorkerMessageHandler<TransactionStoreWorkerEvents>({
            startFailed: ({ reason }) => {
                // Only the reason; nothing identifying the accounts.
                console.warn(`Transaction store did not start: ${reason}`);
            },
            // The store's history comes through Connect, on the backend the user chose.
            getAccountInfo: async ({ requestId, symbol, params }) => {
                const response = await deps
                    .getTrezorConnect()
                    .getAccountInfo({
                        ...params,
                        coin: asCoinSymbol(symbol),
                        suppressBackupWarning: true,
                    })
                    .catch(() => null);
                worker.postMessage(
                    toWorkerMessage<TransactionStoreWorkerCommands, 'accountInfo'>('accountInfo', {
                        requestId,
                        accountInfo: response?.success ? response.payload : null,
                    }),
                );
            },
        });
        const onWorkerMessage = ({ data }: MessageEvent) => handleEvent(data);
        worker.addEventListener('message', onWorkerMessage);

        return {
            transactionStore,
            dispose: async () => {
                // Cleared first, so a caller right after (a React remount) gets a fresh worker.
                service = null;
                await transactionStore.dispose();
                worker.removeEventListener('message', onWorkerMessage);
                worker.terminate();
            },
        };
    };

    return () => {
        service ??= createService();

        return service;
    };
};
