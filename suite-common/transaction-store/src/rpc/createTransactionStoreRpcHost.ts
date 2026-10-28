import type { TransactionStore } from '../transactionStore';
import {
    type TransactionStorePort,
    type TransactionStorePortMessage,
    type TransactionStoreRpcEvent,
    type TransactionStoreRpcRequest,
    type TransactionStoreRpcResponse,
    isTransactionStoreRpcRequest,
} from './transactionStoreRpcProtocol';

export type TransactionStoreRpcHostDeps = {
    transactionStore: TransactionStore;
    port: TransactionStorePort;
};

export type TransactionStoreRpcHost = {
    /** Detaches from the port; the store keeps running. */
    dispose: () => Promise<void>;
};

const callStore = (store: TransactionStore, request: TransactionStoreRpcRequest) => {
    // The request was validated against the method list, and each method's parameters come
    // from the same `TransactionStore` type on the client.
    const method = store[request.method] as (...params: unknown[]) => Promise<unknown>;

    return method(...request.params);
};

/** Serves a store over a port, e.g. from a worker to the app. */
export const createTransactionStoreRpcHost = (
    deps: TransactionStoreRpcHostDeps,
): TransactionStoreRpcHost => {
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

    return {
        dispose: () => {
            deps.port.removeEventListener('message', onMessage);

            return unsubscribePromise.then(unsubscribe => unsubscribe());
        },
    };
};
