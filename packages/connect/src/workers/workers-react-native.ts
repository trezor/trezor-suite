import BlockbookWorker from '@trezor/blockchain-link/lib/workers/blockbook';
import RippleWorker from '@trezor/blockchain-link/lib/workers/ripple';
import BlockfrostWorker from '@trezor/blockchain-link/lib/workers/blockfrost';

import TrezorLink from '@trezor/transport';

import RNUsbPlugin from './RNUsbPlugin';

const WebUsbPlugin = undefined;
const ElectrumWorker = undefined;

// REF-TODO: ts-ignore
// @ts-ignore
const ReactNativeUsbPlugin = () => new TrezorLink.Lowlevel(new RNUsbPlugin());

export {
    WebUsbPlugin,
    ReactNativeUsbPlugin,
    BlockbookWorker,
    RippleWorker,
    BlockfrostWorker,
    ElectrumWorker,
};
