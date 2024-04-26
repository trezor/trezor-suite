import BlockbookWorker from '@trezor/blockchain-link/src/workers/blockbook';
import RippleWorker from '@trezor/blockchain-link/src/workers/ripple';
import BlockfrostWorker from '@trezor/blockchain-link/src/workers/blockfrost';
import type { BaseWorker } from '@trezor/blockchain-link/src/workers/baseWorker';

type WorkerAsyncImporter = () => Promise<BaseWorker<unknown>>;

// Solana has some issues with worker-loader, so it's not used in the browser
const SolanaWorker: WorkerAsyncImporter = () =>
    import(
        /* webpackChunkName: "solana-worker" */ '@trezor/blockchain-link/src/workers/solana'
    ).then(w => w.default());
const ElectrumWorker = undefined;

export { BlockbookWorker, RippleWorker, BlockfrostWorker, ElectrumWorker, SolanaWorker };
