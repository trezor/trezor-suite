import type { BaseWorker } from '@trezor/blockchain-link';

type WorkerAsyncImporter = () => Promise<BaseWorker<unknown>>;

const BlockbookWorker: WorkerAsyncImporter = () =>
    import(/* webpackChunkName: "blockbook-worker" */ '@trezor/blockchain-link-blockbook').then(w =>
        w.default(),
    );
const RippleWorker: WorkerAsyncImporter = () =>
    import(/* webpackChunkName: "ripple-worker" */ '@trezor/blockchain-link-ripple').then(w =>
        w.default(),
    );
const BlockfrostWorker: WorkerAsyncImporter = () =>
    import(/* webpackChunkName: "blockfrost-worker" */ '@trezor/blockchain-link-blockfrost').then(
        w => w.default(),
    );
const ElectrumWorker: WorkerAsyncImporter = () =>
    import(/* webpackChunkName: "electrum-worker" */ '@trezor/blockchain-link-electrum').then(w =>
        w.default(),
    );
const SolanaWorker: WorkerAsyncImporter = () =>
    import(/* webpackChunkName: "solana-worker" */ '@trezor/blockchain-link-solana').then(w =>
        w.default(),
    );
const StellarWorker: WorkerAsyncImporter = () =>
    import(/* webpackChunkName: "stellar-worker" */ '@trezor/blockchain-link-stellar').then(w =>
        w.default(),
    );

const EvmRpcWorker: WorkerAsyncImporter = () =>
    import(/* webpackChunkName: "evm-rpc-worker" */ '@trezor/blockchain-link-evm-rpc').then(w =>
        w.default(),
    );

export {
    BlockbookWorker,
    RippleWorker,
    BlockfrostWorker,
    ElectrumWorker,
    SolanaWorker,
    StellarWorker,
    EvmRpcWorker,
};
