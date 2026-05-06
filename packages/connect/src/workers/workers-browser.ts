import type { BaseWorker } from '@trezor/blockchain-link/src/workers/baseWorker';
import BlockbookWorker from '@trezor/blockchain-link/src/workers/blockbook';
import BlockfrostWorker from '@trezor/blockchain-link/src/workers/blockfrost';
import RippleWorker from '@trezor/blockchain-link/src/workers/ripple';
import StellarWorker from '@trezor/blockchain-link/src/workers/stellar';

type WorkerAsyncImporter = () => Promise<BaseWorker<unknown>>;

// Solana has some issues with worker-loader, so it's not used in the browser
const SolanaWorker: WorkerAsyncImporter = () =>
    import(
        /* webpackChunkName: "workers/solana-worker" */
        '@trezor/blockchain-link/src/workers/solana'
    ).then(w => w.default());
const ElectrumWorker = undefined;

const EvmRpcWorker: WorkerAsyncImporter = () =>
    import(
        /* webpackChunkName: "workers/evm-rpc-worker" */
        '@trezor/blockchain-link/src/workers/evm-rpc'
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
