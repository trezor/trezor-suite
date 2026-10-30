import type { TransactionStore } from '../transactionStore';
import type { Dispose } from '../transactionStoreTypes';
import {
    type TransactionStorePort,
    type TransactionStorePortMessage,
    type TransactionStoreRpcEvent,
    type TransactionStoreRpcRequest,
    type TransactionStoreRpcResponse,
    isTransactionStoreRpcRequest,
} from './transactionStoreRpcProtocol';

export type StartTransactionStoreRpcHostDeps = {
    transactionStore: TransactionStore;
    port: TransactionStorePort;
};

const callStore = (store: TransactionStore, request: TransactionStoreRpcRequest) => {
    // The request was validated against the method list, and each method's parameters come
    // from the same `TransactionStore` type on the client.
    const method = store[request.method] as (...params: unknown[]) => Promise<unknown>;

    return method(...request.params);
};

/**
 * Serves a store over a port, e.g. from a worker to the app. The returned dispose detaches from
 * the port; the store keeps running.
 */
export const startTransactionStoreRpcHost = (deps: StartTransactionStoreRpcHostDeps): Dispose => {
    const post = (message: TransactionStoreRpcResponse | TransactionStoreRpcEvent) =>
        deps.port.postMessage(message);

    const unsubscribePromise = deps.transactionStore.subscribe(event =>
        post({ type: 'transactionStore/event', event }),
    );

    const onMessage = ({ data }: TransactionStorePortMessage) => {
        if (!isTransactionStoreRpcRequest(data)) return;

        callStore(deps.transactionStore, data).then(
            value =>
                post({ type: 'transactionStore/response', id: data.id, isResolved: true, value }),
            () => post({ type: 'transactionStore/response', id: data.id, isResolved: false }),
        );
    };
    deps.port.addEventListener('message', onMessage);

    return () => {
        deps.port.removeEventListener('message', onMessage);

        return unsubscribePromise.then(unsubscribe => unsubscribe());
    };
};
