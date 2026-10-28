import type { TransactionStore } from '../transactionStore';
import type { TransactionStoreListener } from '../transactionStoreTypes';
import {
    type TransactionStorePort,
    type TransactionStoreRpcMethod,
    isTransactionStoreRpcEvent,
    isTransactionStoreRpcResponse,
} from './transactionStoreRpcProtocol';

export type TransactionStoreRpcClientDeps = {
    port: TransactionStorePort;
};

/** The store on the other side of a port, e.g. in a worker. */
export type TransactionStoreRpcClient = TransactionStore;

type PendingCall = { resolve: (value: unknown) => void; reject: (error: Error) => void };

export const createTransactionStoreRpcClient = (
    deps: TransactionStoreRpcClientDeps,
): TransactionStoreRpcClient => {
    const pendingCalls = new Map<number, PendingCall>();
    const listeners = new Set<TransactionStoreListener>();
    let nextId = 0;

    deps.port.addEventListener('message', ({ data }) => {
        if (isTransactionStoreRpcEvent(data)) {
            listeners.forEach(listener => listener(data.event));

            return;
        }
        if (!isTransactionStoreRpcResponse(data)) return;

        const pendingCall = pendingCalls.get(data.id);
        pendingCalls.delete(data.id);

        if (data.isResolved) {
            pendingCall?.resolve(data.value);
        } else {
            // Unexpected on the other side; the store's expected failures come back as `Result`.
            pendingCall?.reject(new Error('Transaction store call failed'));
        }
    });

    const call =
        <M extends TransactionStoreRpcMethod>(method: M) =>
        (...params: Parameters<TransactionStore[M]>) =>
            new Promise<unknown>((resolve, reject) => {
                const id = nextId++;
                pendingCalls.set(id, { resolve, reject });
                const request = { type: 'transactionStore/request', id, method, params };
                deps.port.postMessage(request);
            }) as ReturnType<TransactionStore[M]>;

    return {
        registerAccounts: call('registerAccounts'),
        removeAccounts: call('removeAccounts'),
        watchNetworks: call('watchNetworks'),
        requestSync: call('requestSync'),
        getSyncStatus: call('getSyncStatus'),
        selectTransactions: call('selectTransactions'),
        query: call('query'),
        whenIdle: call('whenIdle'),
        dispose: call('dispose'),
        subscribe: listener => {
            listeners.add(listener);

            return Promise.resolve(() => {
                listeners.delete(listener);
            });
        },
    };
};
