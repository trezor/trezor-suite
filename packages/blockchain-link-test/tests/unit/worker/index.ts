import Blockbook from '@trezor/blockchain-link-blockbook';
import Blockfrost from '@trezor/blockchain-link-blockfrost';
import Ripple from '@trezor/blockchain-link-ripple';

export default [
    { name: 'blockbook', worker: Blockbook },
    { name: 'ripple', worker: Ripple },
    { name: 'blockfrost', worker: Blockfrost },
] as const;
