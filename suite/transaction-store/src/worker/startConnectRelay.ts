import type { BlockchainLinkClient, TransactionStorePort } from '@suite-common/transaction-store';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import {
    type RelayedAccountInfo,
    type TransactionStoreWorkerCommands,
    type TransactionStoreWorkerEvents,
    toWorkerMessage,
} from './transactionStoreWorkerProtocol';

export type ConnectRelay = {
    /** A client for the network that asks the app's Connect instead of a backend of its own. */
    getBlockchainLink: (symbol: NetworkSymbol) => BlockchainLinkClient;
    handleAccountInfo: (payload: TransactionStoreWorkerCommands['accountInfo']) => void;
    /** Fails the requests still waiting for the app. */
    dispose: () => void;
};

type PendingRequest = {
    resolve: (accountInfo: RelayedAccountInfo) => void;
    reject: (error: Error) => void;
};

/**
 * Fetches through the app's Connect for backends the worker cannot run: Electrum needs Node
 * sockets, which only desktop Connect in the Electron main process has. Connect already uses the
 * user's custom backend for that network.
 */
export const startConnectRelay = (port: TransactionStorePort): ConnectRelay => {
    const pending = new Map<number, PendingRequest>();
    let nextRequestId = 0;

    return {
        getBlockchainLink: symbol => ({
            getAccountInfo: params =>
                new Promise((resolve, reject) => {
                    const requestId = nextRequestId++;
                    pending.set(requestId, { resolve, reject });
                    port.postMessage(
                        toWorkerMessage<TransactionStoreWorkerEvents, 'getAccountInfo'>(
                            'getAccountInfo',
                            { requestId, symbol, params },
                        ),
                    );
                }),
        }),

        handleAccountInfo: ({ requestId, accountInfo }) => {
            const request = pending.get(requestId);
            if (request === undefined) return;

            pending.delete(requestId);
            if (accountInfo === null) {
                request.reject(new Error('Connect could not fetch the account'));
            } else {
                request.resolve(accountInfo);
            }
        },

        dispose: () => {
            pending.forEach(({ reject }) => reject(new Error('The relay was disposed')));
            pending.clear();
        },
    };
};
