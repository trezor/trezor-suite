import type { BlockchainLinkClient } from '@suite-common/transaction-store';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { BlockchainLink } from '@trezor/blockchain-link';

import { createBlockchainLinkWorker } from './createBlockchainLinkWorker';
import type { TransactionStoreBackend } from './transactionStoreWorkerProtocol';

export type BlockchainLinks = {
    get: (symbol: NetworkSymbol) => BlockchainLinkClient | undefined;
    setBackends: (backends: TransactionStoreBackend[]) => void;
    disposeAll: () => void;
};

type NetworkLink = { backendKey: string; blockchainLink: BlockchainLink };

const toBackendKey = ({ type, urls }: TransactionStoreBackend) => `${type}|${urls.join(',')}`;

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
            [...links.keys()]
                .filter(symbol => !backends.some(backend => backend.symbol === symbol))
                .forEach(dispose);

            backends.forEach(backend => {
                const backendKey = toBackendKey(backend);
                if (links.get(backend.symbol)?.backendKey === backendKey) return;

                dispose(backend.symbol);
                const worker = createBlockchainLinkWorker(backend.type);
                if (worker === undefined || backend.urls.length === 0) return;

                // Never subscribed to blocks: the store fetches only when the app asks it to.
                links.set(backend.symbol, {
                    backendKey,
                    blockchainLink: new BlockchainLink({
                        name: backend.symbol,
                        worker,
                        server: backend.urls,
                    }),
                });
            });
        },

        disposeAll: () => [...links.keys()].forEach(dispose),
    };
};
