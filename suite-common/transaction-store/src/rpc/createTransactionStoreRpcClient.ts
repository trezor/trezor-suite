import type { TransactionStore } from '../transactionStore';
import type { TransactionStoreListener } from '../transactionStoreTypes';
import {
    type TransactionStorePort,
    type TransactionStorePortMessage,
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

    const onMessage = ({ data }: TransactionStorePortMessage) => {
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
    };
    deps.port.addEventListener('message', onMessage);

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
        setAccounts: call('setAccounts'),
        removeAccounts: call('removeAccounts'),
        requestSync: call('requestSync'),
        getSyncStatus: call('getSyncStatus'),
        selectTransactions: call('selectTransactions'),
        countTransactions: call('countTransactions'),
        query: call('query'),
        whenIdle: call('whenIdle'),
        // The store on the other side stops first, then the client lets go of the port.
        dispose: () =>
            call('dispose')().finally(() => {
                deps.port.removeEventListener('message', onMessage);
                listeners.clear();
            }),
        subscribe: listener => {
            listeners.add(listener);

            return Promise.resolve(() => {
                listeners.delete(listener);
            });
        },
    };
};
