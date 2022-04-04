import BlockbookWorker from '@trezor/blockchain-link/lib/workers/blockbook';
import RippleWorker from '@trezor/blockchain-link/lib/workers/ripple';
import BlockfrostWorker from '@trezor/blockchain-link/lib/workers/blockfrost';
import ElectrumWorker from '@trezor/blockchain-link/lib/workers/electrum';
import type { Transport } from '@trezor/transport';

type TransportWrapper = () => Transport;

const WebUsbPlugin: TransportWrapper | typeof undefined = undefined;
const ReactNativeUsbPlugin: TransportWrapper | typeof undefined = undefined;

export {
    WebUsbPlugin,
    ReactNativeUsbPlugin,
    BlockbookWorker,
    RippleWorker,
    BlockfrostWorker,
    ElectrumWorker,
};
