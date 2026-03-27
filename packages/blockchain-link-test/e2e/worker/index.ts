import BlockbookWorker from '@trezor/blockchain-link-blockbook';
import BlockfrostWorker from '@trezor/blockchain-link-blockfrost';
import RippleWorker from '@trezor/blockchain-link-ripple';

export default [
    { name: 'blockbook', worker: BlockbookWorker },
    { name: 'blockfrost', worker: BlockfrostWorker },
    { name: 'ripple', worker: RippleWorker },
] as const;
