import type { TransactionStore } from '../transactionStore';
import type { Dispose, Unsubscribe } from '../transactionStoreTypes';
import {
    type TransactionStorePort,
    type TransactionStorePortMessage,
    type TransactionStoreRpcMessage,
    isTransactionStoreRpcMessage,
} from './transactionStoreRpcProtocol';

export type StartTransactionStoreRpcHostDeps = {
    transactionStore: TransactionStore;
    port: TransactionStorePort;
};

type RequestMessage = Extract<TransactionStoreRpcMessage, { type: 'transactionStore/request' }>;

const callStore = (store: TransactionStore, request: RequestMessage) => {
    // Each method's parameters come from the same `TransactionStore` type on the client.
    const method = store[request.method] as (...params: unknown[]) => Promise<unknown>;

    return method(...request.params);
};

/**
 * Serves a store over a port, e.g. from a worker to the app. The returned dispose detaches from
 * the port and ends the app's live queries; the store keeps running.
 */
export const startTransactionStoreRpcHost = (deps: StartTransactionStoreRpcHostDeps): Dispose => {
    const subscriptions = new Map<number, Unsubscribe>();

    const post = (message: TransactionStoreRpcMessage) => deps.port.postMessage(message);

    const onMessage = ({ data }: TransactionStorePortMessage) => {
        if (!isTransactionStoreRpcMessage(data)) return;

        switch (data.type) {
            case 'transactionStore/request':
                callStore(deps.transactionStore, data).then(
                    value =>
                        post({
                            type: 'transactionStore/response',
                            id: data.id,
                            isResolved: true,
                            value,
                        }),
                    () =>
                        post({ type: 'transactionStore/response', id: data.id, isResolved: false }),
                );
                break;
            case 'transactionStore/subscribeQuery':
                subscriptions.set(
                    data.subscriptionId,
                    deps.transactionStore.subscribeQuery(data.query, rows =>
                        post({
                            type: 'transactionStore/queryRows',
                            subscriptionId: data.subscriptionId,
                            rows,
                        }),
                    ),
                );
                break;
            case 'transactionStore/unsubscribeQuery':
                subscriptions.get(data.subscriptionId)?.();
                subscriptions.delete(data.subscriptionId);
                break;
        }
    };
    deps.port.addEventListener('message', onMessage);

    return () => {
        deps.port.removeEventListener('message', onMessage);
        subscriptions.forEach(unsubscribe => unsubscribe());
        subscriptions.clear();

        return Promise.resolve();
    };
};
