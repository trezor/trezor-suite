import type { NetworkSymbol } from '@suite-common/wallet-config';

import type { TransactionRepositoryDep } from '../repository/createTransactionRepository';
import type { TransactionSourceDep } from '../source/transactionSource';
import type { SyncQueueDep } from '../sync/createSyncQueue';
import type { Unsubscribe } from '../transactionStoreTypes';

/** @serviceContract */
export type StartInterval = (params: { callback: () => void; intervalMs: number }) => Unsubscribe;

export type NetworkWatcherDeps = SyncQueueDep &
    TransactionRepositoryDep &
    TransactionSourceDep & {
        startInterval: StartInterval;
        /** Catches up when blocks do not arrive (a dropped socket) and picks up mempool. */
        fallbackIntervalMs: number;
    };

export type NetworkWatcher = {
    /** The networks to keep fresh; the ones left out stop being watched. */
    watchNetworks: (symbols: NetworkSymbol[]) => Promise<void>;
    getWatchedNetworks: () => NetworkSymbol[];
    unwatchAll: () => void;
};

export type NetworkWatcherDep = { networkWatcher: NetworkWatcher };

type Watch = { stopInterval: Unsubscribe; unsubscribeBlocks: Unsubscribe | null };

export const createNetworkWatcher = (deps: NetworkWatcherDeps): NetworkWatcher => {
    const watches = new Map<NetworkSymbol, Watch>();

    const syncNetwork = (symbol: NetworkSymbol) =>
        deps.syncQueue.requestSync({
            accountKeys: deps.transactionRepository
                .selectAccounts({ symbol })
                .map(({ accountKey }) => accountKey),
            mode: 'latest',
        });

    const unwatch = (symbol: NetworkSymbol) => {
        const watch = watches.get(symbol);
        watches.delete(symbol);
        watch?.stopInterval();
        watch?.unsubscribeBlocks?.();
    };

    const watch = async (symbol: NetworkSymbol) => {
        const networkWatch: Watch = {
            stopInterval: deps.startInterval({
                callback: () => syncNetwork(symbol),
                intervalMs: deps.fallbackIntervalMs,
            }),
            unsubscribeBlocks: null,
        };
        watches.set(symbol, networkWatch);
        syncNetwork(symbol);

        const subscription = await deps.transactionSource.subscribeBlocks({
            symbol,
            onBlock: () => syncNetwork(symbol),
        });

        if (!subscription.success) {
            // Without blocks, the interval keeps the network fresh on its own.
            return;
        }
        if (watches.get(symbol) !== networkWatch) {
            // Unwatched while subscribing.
            subscription.payload();

            return;
        }

        networkWatch.unsubscribeBlocks = subscription.payload;
    };

    return {
        watchNetworks: async symbols => {
            [...watches.keys()].filter(symbol => !symbols.includes(symbol)).forEach(unwatch);
            await Promise.all(symbols.filter(symbol => !watches.has(symbol)).map(watch));
        },
        getWatchedNetworks: () => [...watches.keys()],
        unwatchAll: () => [...watches.keys()].forEach(unwatch),
    };
};
