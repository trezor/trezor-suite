import type { BaseWorker } from '@trezor/blockchain-link/workers/baseWorker';

type WorkerAsyncImporter = () => Promise<BaseWorker<unknown>>;

const BlockbookWorker = () =>
    new Worker(
        new URL(
            /* webpackChunkName: "workers/blockbook-worker" */
            '@trezor/blockchain-link/workers/blockbook',
            import.meta.url,
        ),
        { type: 'module' },
    );

const BlockfrostWorker = () =>
    new Worker(
        new URL(
            /* webpackChunkName: "workers/blockfrost-worker" */
            '@trezor/blockchain-link/workers/blockfrost',
            import.meta.url,
        ),
        { type: 'module' },
    );

const RippleWorker = () =>
    new Worker(
        new URL(
            /* webpackChunkName: "workers/ripple-worker" */
            '@trezor/blockchain-link/workers/ripple',
            import.meta.url,
        ),
        { type: 'module' },
    );

const StellarWorker = () =>
    new Worker(
        new URL(
            /* webpackChunkName: "workers/stellar-worker" */
            '@trezor/blockchain-link/workers/stellar',
            import.meta.url,
        ),
        { type: 'module' },
    );

// Solana has some issues with worker-loader, so it's not used in the browser
const SolanaWorker: WorkerAsyncImporter = () =>
    import(
        /* webpackChunkName: "workers/solana-worker" */
        '@trezor/blockchain-link/workers/solana'
    ).then(w => w.default());
const ElectrumWorker = undefined;

const EvmRpcWorker: WorkerAsyncImporter = () =>
    import(
        /* webpackChunkName: "workers/evm-rpc-worker" */
        '@trezor/blockchain-link/workers/evm-rpc'
    ).then(w => w.default());

export {
    BlockbookWorker,
    RippleWorker,
    BlockfrostWorker,
    ElectrumWorker,
    SolanaWorker,
    StellarWorker,
    EvmRpcWorker,
};
