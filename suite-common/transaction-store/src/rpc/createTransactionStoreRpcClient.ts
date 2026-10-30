import type { TransactionStore } from '../transactionStore';
import {
    type TransactionStorePort,
    type TransactionStorePortMessage,
    type TransactionStoreRpcMessage,
    type TransactionStoreRpcMethod,
    isTransactionStoreRpcMessage,
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
    const subscriptions = new Map<number, (rows: unknown[]) => void>();
    let nextId = 0;

    const post = (message: TransactionStoreRpcMessage) => deps.port.postMessage(message);

    const onMessage = ({ data }: TransactionStorePortMessage) => {
        if (!isTransactionStoreRpcMessage(data)) return;

        if (data.type === 'transactionStore/queryRows') {
            subscriptions.get(data.subscriptionId)?.(data.rows);
        } else if (data.type === 'transactionStore/response') {
            const pendingCall = pendingCalls.get(data.id);
            pendingCalls.delete(data.id);

            if (data.isResolved) {
                pendingCall?.resolve(data.value);
            } else {
                // Unexpected on the other side; the store's expected failures come back as data.
                pendingCall?.reject(new Error('Transaction store call failed'));
            }
        }
    };
    deps.port.addEventListener('message', onMessage);

    const call =
        <M extends TransactionStoreRpcMethod>(method: M) =>
        (...params: Parameters<TransactionStore[M]>) =>
            new Promise<unknown>((resolve, reject) => {
                const id = nextId++;
                pendingCalls.set(id, { resolve, reject });
                deps.port.postMessage({ type: 'transactionStore/request', id, method, params });
            }) as ReturnType<TransactionStore[M]>;

    return {
        setAccounts: call('setAccounts'),
        setKnownTokens: call('setKnownTokens'),
        requestFullHistory: call('requestFullHistory'),
        subscribeQuery: ({ sql, parameters, accountKeys }, onRows) => {
            const subscriptionId = nextId++;
            // The rows are the query's; its type travels with it.
            subscriptions.set(subscriptionId, onRows as (rows: unknown[]) => void);
            post({
                type: 'transactionStore/subscribeQuery',
                subscriptionId,
                query: { sql, parameters, accountKeys },
            });

            return () => {
                subscriptions.delete(subscriptionId);
                post({ type: 'transactionStore/unsubscribeQuery', subscriptionId });
            };
        },
        // The store on the other side stops first, then the client lets go of the port.
        dispose: () =>
            call('dispose')().finally(() => {
                deps.port.removeEventListener('message', onMessage);
                subscriptions.clear();
            }),
    };
};
