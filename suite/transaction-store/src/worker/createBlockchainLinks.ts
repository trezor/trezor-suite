import type { BlockchainLinkClient } from '@suite-common/transaction-store';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { BlockchainLink } from '@trezor/blockchain-link';

import { createBlockchainLinkWorker } from './createBlockchainLinkWorker';
import type { TransactionStoreBackend } from './transactionStoreWorkerProtocol';

export type BlockchainLinks = {
    get: (symbol: NetworkSymbol) => BlockchainLinkClient | undefined;
    /** Returns the networks whose backend changed, so their history and blocks are re-fetched. */
    setBackends: (backends: TransactionStoreBackend[]) => NetworkSymbol[];
    disposeAll: () => void;
};

type NetworkLink = { backendKey: string; blockchainLink: BlockchainLink };

const toBackendKey = ({ type, urls }: TransactionStoreBackend) => `${type}|${urls.join(',')}`;

// The same throttling as Connect's, so the store does not sync more often than the app does.
const getThrottleBlockEvent = ({ symbol, type }: TransactionStoreBackend) => {
    if (type === 'ripple' || type === 'stellar') return 60 * 1000;
    if (getNetworkType(symbol) === 'ethereum' || symbol === 'trx') return 12 * 1000;

    return undefined;
};

/** The store's own blockchain-link per network, apart from Connect's, on the user's backend. */
export const createBlockchainLinks = (): BlockchainLinks => {
    const links = new Map<NetworkSymbol, NetworkLink>();

    const dispose = (symbol: NetworkSymbol) => {
        links.get(symbol)?.blockchainLink.dispose();
        links.delete(symbol);
    };

    return {
        get: symbol => links.get(symbol)?.blockchainLink,

        setBackends: backends => {
            const removed = [...links.keys()].filter(
                symbol => !backends.some(backend => backend.symbol === symbol),
            );
            removed.forEach(dispose);

            const changed = backends.filter(backend => {
                const backendKey = toBackendKey(backend);
                if (links.get(backend.symbol)?.backendKey === backendKey) return false;

                dispose(backend.symbol);
                const worker = createBlockchainLinkWorker(backend.type);
                if (worker === undefined || backend.urls.length === 0) return true;

                links.set(backend.symbol, {
                    backendKey,
                    blockchainLink: new BlockchainLink({
                        name: backend.symbol,
                        worker,
                        server: backend.urls,
                        throttleBlockEvent: getThrottleBlockEvent(backend),
                    }),
                });

                return true;
            });

            return [...removed, ...changed.map(({ symbol }) => symbol)];
        },

        disposeAll: () => [...links.keys()].forEach(dispose),
    };
};
