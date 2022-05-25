import BlockbookWorker from '@trezor/blockchain-link/lib/workers/blockbook';
import RippleWorker from '@trezor/blockchain-link/lib/workers/ripple';
import BlockfrostWorker from '@trezor/blockchain-link/lib/workers/blockfrost';
import { TransportWithSharedConnections } from '@trezor/transport';
import { ReactNativePlugin } from './RNUsbPlugin';

const WebUsbPlugin = undefined;
const ElectrumWorker = undefined;

const ReactNativeUsbPlugin = () =>
    new TransportWithSharedConnections(new ReactNativePlugin(), undefined);

export {
    WebUsbPlugin,
    ReactNativeUsbPlugin,
    BlockbookWorker,
    RippleWorker,
    BlockfrostWorker,
    ElectrumWorker,
};
