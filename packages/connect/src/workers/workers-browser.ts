import type { BaseWorker } from '@trezor/blockchain-link';
import BlockbookWorker from '@trezor/blockchain-link-blockbook';
import BlockfrostWorker from '@trezor/blockchain-link-blockfrost';
import RippleWorker from '@trezor/blockchain-link-ripple';
import StellarWorker from '@trezor/blockchain-link-stellar';

type WorkerAsyncImporter = () => Promise<BaseWorker<unknown>>;

// Solana has some issues with worker-loader, so it's not used in the browser
const SolanaWorker: WorkerAsyncImporter = () =>
    import(/* webpackChunkName: "solana-worker" */ '@trezor/blockchain-link-solana').then(w =>
        w.default(),
    );
const ElectrumWorker = undefined;

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
