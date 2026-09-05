import type { BaseWorker } from '@trezor/blockchain-link/workers/baseWorker';

type WorkerAsyncImporter = () => Promise<BaseWorker<unknown>>;

const BlockbookWorker: WorkerAsyncImporter = () =>
    import(
        /* webpackChunkName: "workers/blockbook-worker" */
        '@trezor/blockchain-link/workers/blockbook'
    ).then(w => w.default());
const RippleWorker: WorkerAsyncImporter = () =>
    import(
        /* webpackChunkName: "workers/ripple-worker" */
        '@trezor/blockchain-link/workers/ripple'
    ).then(w => w.default());
const BlockfrostWorker: WorkerAsyncImporter = () =>
    import(
        /* webpackChunkName: "workers/blockfrost-worker" */
        '@trezor/blockchain-link/workers/blockfrost'
    ).then(w => w.default());
const ElectrumWorker: WorkerAsyncImporter = () =>
    import(
        /* webpackChunkName: "workers/electrum-worker" */
        '@trezor/blockchain-link/workers/electrum'
    ).then(w => w.default());
const SolanaWorker: WorkerAsyncImporter = () =>
    import(
        /* webpackChunkName: "workers/solana-worker" */
        '@trezor/blockchain-link/workers/solana'
    ).then(w => w.default());
const StellarWorker: WorkerAsyncImporter = () =>
    import(
        /* webpackChunkName: "workers/stellar-worker" */
        '@trezor/blockchain-link/workers/stellar'
    ).then(w => w.default());

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
