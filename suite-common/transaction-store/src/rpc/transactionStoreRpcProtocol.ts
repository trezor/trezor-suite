import type { TransactionStore } from '../transactionStore';
import type { TransactionStoreEvent } from '../transactionStoreTypes';

/** Everything but `subscribe`, which the client serves locally from forwarded events. */
export type TransactionStoreRpcMethod = Exclude<keyof TransactionStore, 'subscribe'>;

export const TRANSACTION_STORE_RPC_METHODS = [
    'setAccounts',
    'removeAccounts',
    'watchNetworks',
    'requestSync',
    'getSyncStatus',
    'selectTransactions',
    'countTransactions',
    'query',
    'whenIdle',
    'dispose',
] as const satisfies ReadonlyArray<TransactionStoreRpcMethod>;

export type TransactionStoreRpcRequest = {
    [M in TransactionStoreRpcMethod]: {
        type: 'transactionStore/request';
        id: number;
        method: M;
        params: Parameters<TransactionStore[M]>;
    };
}[TransactionStoreRpcMethod];

export type TransactionStoreRpcResponse =
    | { type: 'transactionStore/response'; id: number; isResolved: true; value: unknown }
    // No error detail crosses the boundary; it could carry account data.
    | { type: 'transactionStore/response'; id: number; isResolved: false };

export type TransactionStoreRpcEvent = {
    type: 'transactionStore/event';
    event: TransactionStoreEvent;
};

export type TransactionStorePortMessage = { data: unknown };

type MessageListener = (message: TransactionStorePortMessage) => void;

/**
 * Either end of the boundary: a `Worker` on the app side, the worker's `self` inside it, or a
 * `MessagePort` (started) wherever else the store runs.
 *
 * @serviceContract
 */
export type TransactionStorePort = {
    postMessage: (message: unknown) => void;
    addEventListener: (type: 'message', listener: MessageListener) => void;
    removeEventListener: (type: 'message', listener: MessageListener) => void;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

export const isTransactionStoreRpcRequest = (
    message: unknown,
): message is TransactionStoreRpcRequest =>
    isObject(message) &&
    message.type === 'transactionStore/request' &&
    typeof message.id === 'number' &&
    TRANSACTION_STORE_RPC_METHODS.some(method => method === message.method) &&
    Array.isArray(message.params);

export const isTransactionStoreRpcResponse = (
    message: unknown,
): message is TransactionStoreRpcResponse =>
    isObject(message) &&
    message.type === 'transactionStore/response' &&
    typeof message.id === 'number' &&
    typeof message.isResolved === 'boolean';

export const isTransactionStoreRpcEvent = (message: unknown): message is TransactionStoreRpcEvent =>
    isObject(message) && message.type === 'transactionStore/event' && isObject(message.event);
