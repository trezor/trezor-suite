import BlockbookWorker from '@trezor/blockchain-link/src/workers/blockbook';
import BlockfrostWorker from '@trezor/blockchain-link/src/workers/blockfrost';
import RippleWorker from '@trezor/blockchain-link/src/workers/ripple';
import SolanaWorker from '@trezor/blockchain-link/src/workers/solana';
import StellarWorker from '@trezor/blockchain-link/src/workers/stellar';

const ElectrumWorker = undefined;

export {
    BlockbookWorker,
    RippleWorker,
    BlockfrostWorker,
    ElectrumWorker,
    SolanaWorker,
    StellarWorker,
};
