/**
 * The transaction store's worker, for web and the Electron renderer: the whole engine (sync,
 * backends, SQLite) runs here, off the app's main thread. Only RPC messages cross to the app.
 */
import {
    Name,
    type SafeSql,
    type SqliteQueryParameters,
    createRun,
    getOrThrow,
} from '@evolu/common';
import { installPolyfills } from '@evolu/common/polyfills';
import { createWasmSqliteDriver } from '@evolu/web';

import {
    type Dispose,
    type TransactionStore,
    type TransactionStorePort,
    type TransactionStorePortMessage,
    type TransactionStoreSqlite,
    createBlockchainLinkTransactionSource,
    createTransactionStoreCompositionRoot,
    startTransactionStoreRpcHost,
} from '@suite-common/transaction-store';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';

import { createBlockchainLinks } from './createBlockchainLinks';
import { startBufferedPort } from './startBufferedPort';
import {
    type TransactionStoreWorkerCommands,
    type TransactionStoreWorkerEvents,
    createWorkerMessageHandler,
    toWorkerMessage,
} from './transactionStoreWorkerProtocol';

const DATABASE_NAME = 'trezor-transaction-store';
const PAGE_SIZE = 25;
const MAX_CONCURRENT_JOBS_PER_NETWORK = 2;
const FALLBACK_INTERVAL_MS = 60 * 1000;

// As the app's `shouldSubscribeBlocks`: a Solana block comes every ~400 ms, too often to sync on.
// Inlined, so the worker does not bundle wallet-utils and everything it imports.
const shouldSubscribeBlocks = (symbol: NetworkSymbol) => getNetworkType(symbol) !== 'solana';

// In a worker, `self` posts to the app without a target origin, unlike a window.
const workerPort = self as unknown as TransactionStorePort;
const postStartFailed = (payload: TransactionStoreWorkerEvents['startFailed']) =>
    workerPort.postMessage(
        toWorkerMessage<TransactionStoreWorkerEvents, 'startFailed'>('startFailed', payload),
    );

type OpenedSqlite = { sqlite: TransactionStoreSqlite; close: () => void };

const openSqlite = async (): Promise<OpenedSqlite> => {
    installPolyfills();
    await using run = createRun();
    // Persistent in OPFS, in a pool of its own, apart from Evolu's suite-sync database.
    const driver = getOrThrow(await run(createWasmSqliteDriver(Name.orThrow(DATABASE_NAME))));

    return {
        sqlite: {
            exec: query => {
                const result = driver.exec({
                    sql: query.sql as SafeSql,
                    // Evolu brands numbers as finite; the store only binds integers and timestamps.
                    parameters: query.parameters as SqliteQueryParameters,
                });

                return { rows: result.rows as never, changes: result.changes };
            },
        },
        close: () => driver[Symbol.dispose](),
    };
};

/** Re-subscribes a network whose backend changed, so blocks come from the new one. */
const rewatchNetworks = async (
    transactionStore: TransactionStore,
    watchedNetworks: NetworkSymbol[],
    changedNetworks: NetworkSymbol[],
) => {
    const changedWatched = watchedNetworks.filter(symbol => changedNetworks.includes(symbol));
    if (changedWatched.length === 0) return;

    await transactionStore.watchNetworks(
        watchedNetworks.filter(symbol => !changedWatched.includes(symbol)),
    );
    await transactionStore.watchNetworks(watchedNetworks);
};

/**
 * Starts the store and serves it to the app; resolves with what stops all of it again, or with
 * `null` if the database is from a newer version.
 */
const startTransactionStoreWorker = async (): Promise<Dispose | null> => {
    const bufferedPort = startBufferedPort(workerPort);
    const blockchainLinks = createBlockchainLinks();
    const { sqlite, close } = await openSqlite();
    const started = createTransactionStoreCompositionRoot({
        sqlite,
        transactionSource: createBlockchainLinkTransactionSource({
            getBlockchainLink: blockchainLinks.get,
            pageSize: PAGE_SIZE,
            shouldSubscribeBlocks,
        }),
        startInterval: ({ callback, intervalMs }) => {
            const interval = setInterval(callback, intervalMs);

            return () => clearInterval(interval);
        },
        now: () => Date.now(),
        maxConcurrentJobsPerNetwork: MAX_CONCURRENT_JOBS_PER_NETWORK,
        fallbackIntervalMs: FALLBACK_INTERVAL_MS,
    });

    if (!started.success) {
        bufferedPort.dispose();
        close();

        return null;
    }

    const engine = started.payload;
    let watchedNetworks: NetworkSymbol[] = [];
    const disposeEngine = async () => {
        blockchainLinks.disposeAll();
        await engine.dispose();
        close();
    };
    // The entry needs to know what is watched to re-subscribe on a backend change, and the app's
    // `dispose` stops the engine here; the worker is terminated right after.
    const transactionStore: TransactionStore = {
        ...engine,
        watchNetworks: symbols => {
            watchedNetworks = symbols;

            return engine.watchNetworks(symbols);
        },
        dispose: disposeEngine,
    };

    const handleCommand = createWorkerMessageHandler<TransactionStoreWorkerCommands>({
        setBackends: ({ backends }) => {
            const changedNetworks = blockchainLinks.setBackends(backends);
            void rewatchNetworks(engine, watchedNetworks, changedNetworks);
        },
    });
    const onWorkerMessage = ({ data }: TransactionStorePortMessage) => handleCommand(data);
    bufferedPort.port.addEventListener('message', onWorkerMessage);
    const disposeRpcHost = startTransactionStoreRpcHost({
        transactionStore,
        port: bufferedPort.port,
    });
    bufferedPort.open();

    return async () => {
        await disposeRpcHost();
        bufferedPort.port.removeEventListener('message', onWorkerMessage);
        bufferedPort.dispose();
        await disposeEngine();
        await started.payload?.dispose();
    };
};

// The returned dispose is for whatever hosts the worker without terminating it; the app's
// `dispose` already stops the engine through the RPC before ending the worker.
startTransactionStoreWorker().then(
    dispose => {
        if (dispose === null) postStartFailed({ reason: 'SchemaFromNewerVersion' });
    },
    () => postStartFailed({ reason: 'DatabaseUnavailable' }),
);
