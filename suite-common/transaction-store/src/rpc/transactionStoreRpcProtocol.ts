import type { SqlQuery } from '../sqlite/transactionStoreSqlite';
import type { TransactionStore } from '../transactionStore';

/** Everything but `subscribeQuery`, whose callback stays on the client. */
export type TransactionStoreRpcMethod = Exclude<keyof TransactionStore, 'subscribeQuery'>;

/**
 * Every message between the app and the store. Both ends are built from the same
 * `TransactionStore` type and ship together, so a message is trusted once its `type` says it is
 * the store's; nothing else is checked.
 */
export type TransactionStoreRpcMessage =
    | {
          [M in TransactionStoreRpcMethod]: {
              type: 'transactionStore/request';
              id: number;
              method: M;
              params: Parameters<TransactionStore[M]>;
          };
      }[TransactionStoreRpcMethod]
    | { type: 'transactionStore/response'; id: number; isResolved: true; value: unknown }
    // No error detail crosses the boundary; it could carry account data.
    | { type: 'transactionStore/response'; id: number; isResolved: false }
    | { type: 'transactionStore/subscribeQuery'; subscriptionId: number; query: SqlQuery }
    | { type: 'transactionStore/unsubscribeQuery'; subscriptionId: number }
    | { type: 'transactionStore/queryRows'; subscriptionId: number; rows: unknown[] };

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

/** The store's messages share the port with others, such as the worker's own. */
export const isTransactionStoreRpcMessage = (
    message: unknown,
): message is TransactionStoreRpcMessage =>
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    typeof message.type === 'string' &&
    message.type.startsWith('transactionStore/');
