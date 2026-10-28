import {
    type TransactionStore,
    createTransactionStoreRpcClient,
} from '@suite-common/transaction-store';
import type { CustomBackend } from '@suite-common/wallet-types';
import type { GetTrezorConnectPrivilegedDep } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import {
    type TransactionStoreBackend,
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
    /** A backend without URLs stands for the network's default one, which Connect knows. */
    setBackends: (backends: CustomBackend[]) => Promise<void>;
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

    const resolveBackend = async (
        backend: CustomBackend,
    ): Promise<TransactionStoreBackend | null> => {
        if (backend.urls.length > 0) return backend;

        // One network Connect cannot answer for must not take the others' backends with it.
        const coinInfo = await deps
            .getTrezorConnect()
            .getCoinInfo({ coin: asCoinSymbol(backend.symbol) })
            .catch(() => null);
        const blockchainLink = coinInfo?.success ? coinInfo.payload.blockchainLink : undefined;

        return blockchainLink === undefined
            ? null
            : {
                  symbol: backend.symbol,
                  // The network's own default backend, one of `BackendType` by construction.
                  type: blockchainLink.type as TransactionStoreBackend['type'],
                  urls: blockchainLink.url,
              };
    };

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
        });
        const onWorkerMessage = ({ data }: MessageEvent) => handleEvent(data);
        worker.addEventListener('message', onWorkerMessage);

        return {
            transactionStore,
            setBackends: async backends => {
                const resolved = await Promise.all(backends.map(resolveBackend));
                worker.postMessage(
                    toWorkerMessage<TransactionStoreWorkerCommands, 'setBackends'>('setBackends', {
                        backends: resolved.filter(
                            (backend): backend is TransactionStoreBackend => backend !== null,
                        ),
                    }),
                );
            },
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
