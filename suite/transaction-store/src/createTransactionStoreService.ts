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

export type GetTransactionStoreServiceDeps = GetTrezorConnectPrivilegedDep & {
    createWorker: () => Worker;
};

export type TransactionStoreService = {
    transactionStore: TransactionStore;
    /** Disposes the store, then ends its worker. */
    dispose: () => Promise<void>;
};

/** Spawns the worker on the first call only, so nothing runs until the store is used. */
export type GetTransactionStoreService = () => TransactionStoreService;

export type GetTransactionStoreServiceDep = {
    getTransactionStoreService: GetTransactionStoreService;
};

export const injectGetTransactionStoreService = (services: any): GetTransactionStoreServiceDep => ({
    getTransactionStoreService: services.getTransactionStoreService,
});

export const createGetTransactionStoreService = (
    deps: GetTransactionStoreServiceDeps,
): GetTransactionStoreService => {
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
