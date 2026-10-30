import type { BlockchainLinkClient } from '@suite-common/transaction-store';
import type { NetworkSymbol } from '@suite-common/wallet-config';

/**
 * The worker's own messages, beside the store's RPC. Each map below is the single source of the
 * message names and their payloads: senders build messages with `toWorkerMessage`, receivers
 * handle them with `createWorkerMessageHandler`, which requires a handler for every name.
 */

export type RelayedAccountInfoParams = Parameters<BlockchainLinkClient['getAccountInfo']>[0];

export type RelayedAccountInfo = Awaited<ReturnType<BlockchainLinkClient['getAccountInfo']>>;

/** App → worker. */
export type TransactionStoreWorkerCommands = {
    /** Connect's answer to `getAccountInfo`; `null` when it failed. */
    accountInfo: { requestId: number; accountInfo: RelayedAccountInfo | null };
};

/** Worker → app. */
export type TransactionStoreWorkerEvents = {
    startFailed: { reason: 'DatabaseUnavailable' | 'SchemaFromNewerVersion' };
    /** A page of an account's history, which the app's Connect fetches. */
    getAccountInfo: {
        requestId: number;
        symbol: NetworkSymbol;
        params: RelayedAccountInfoParams;
    };
};

const MESSAGE_TYPE_PREFIX = 'transactionStoreWorker/';

type MessageName<TMap> = keyof TMap & string;

export type WorkerMessage<TMap> = {
    [K in MessageName<TMap>]: { type: `${typeof MESSAGE_TYPE_PREFIX}${K}`; payload: TMap[K] };
}[MessageName<TMap>];

export type WorkerMessageHandlers<TMap> = {
    [K in MessageName<TMap>]: (payload: TMap[K]) => void;
};

export const toWorkerMessage = <TMap, K extends MessageName<TMap>>(
    name: K,
    payload: TMap[K],
): WorkerMessage<TMap> => ({ type: `${MESSAGE_TYPE_PREFIX}${name}`, payload });

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

/** Calls the handler named by the message's type; ignores messages that are not the worker's. */
export const createWorkerMessageHandler =
    <TMap>(handlers: WorkerMessageHandlers<TMap>) =>
    (message: unknown) => {
        if (!isObject(message) || typeof message.type !== 'string') return;
        if (!message.type.startsWith(MESSAGE_TYPE_PREFIX)) return;

        const name = message.type.slice(MESSAGE_TYPE_PREFIX.length);
        if (!Object.hasOwn(handlers, name)) return;

        // Both ends are this package's code, typed by the same map, so the payload is the one
        // that name carries.
        const handler = handlers[name as MessageName<TMap>] as (payload: unknown) => void;
        handler(message.payload);
    };
