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

export type BlockchainLinksDeps = {
    /** For a backend the worker has no blockchain-link worker for. */
    getRelayedBlockchainLink: (symbol: NetworkSymbol) => BlockchainLinkClient;
};

type NetworkLink = { backendKey: string; client: BlockchainLinkClient; dispose: () => void };

const toBackendKey = ({ type, urls }: TransactionStoreBackend) => `${type}|${urls.join(',')}`;

/**
 * The store's own blockchain-link per network, apart from Connect's, on the user's backend; or the
 * relay to Connect for a backend only Connect can reach.
 */
export const createBlockchainLinks = (deps: BlockchainLinksDeps): BlockchainLinks => {
    const links = new Map<NetworkSymbol, NetworkLink>();

    const dispose = (symbol: NetworkSymbol) => {
        links.get(symbol)?.dispose();
        links.delete(symbol);
    };

    const createLink = (backend: TransactionStoreBackend): Omit<NetworkLink, 'backendKey'> => {
        const worker = createBlockchainLinkWorker(backend.type);

        if (worker === undefined) {
            return { client: deps.getRelayedBlockchainLink(backend.symbol), dispose: () => {} };
        }

        // Never subscribed to blocks: the store fetches only when the app asks it to.
        const blockchainLink = new BlockchainLink({
            name: backend.symbol,
            worker,
            server: backend.urls,
        });

        return { client: blockchainLink, dispose: () => blockchainLink.dispose() };
    };

    return {
        get: symbol => links.get(symbol)?.client,

        setBackends: backends => {
            [...links.keys()]
                .filter(symbol => !backends.some(backend => backend.symbol === symbol))
                .forEach(dispose);

            backends.forEach(backend => {
                const backendKey = toBackendKey(backend);
                if (links.get(backend.symbol)?.backendKey === backendKey) return;

                dispose(backend.symbol);
                if (backend.urls.length === 0) return;

                links.set(backend.symbol, { backendKey, ...createLink(backend) });
            });
        },

        disposeAll: () => [...links.keys()].forEach(dispose),
    };
};
