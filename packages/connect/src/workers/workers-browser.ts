import BlockbookWorker from '@trezor/blockchain-link/lib/workers/blockbook';
import RippleWorker from '@trezor/blockchain-link/lib/workers/ripple';
import BlockfrostWorker from '@trezor/blockchain-link/lib/workers/blockfrost';
// import SharedWorker from '@trezor/transport/lib/sessions/background-sharedworker';

const ReactNativeUsbPlugin = undefined;
const ElectrumWorker = undefined;

export {
    ReactNativeUsbPlugin,
    BlockbookWorker,
    RippleWorker,
    BlockfrostWorker,
    ElectrumWorker,
    // todo:
    // unused export -> needed for iframe webpack config
    // SharedWorker,
};
