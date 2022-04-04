import SharedConnectionWorker from '@trezor/transport/lib/lowlevel/sharedConnectionWorker';
import BlockbookWorker from '@trezor/blockchain-link/lib/workers/blockbook';
import RippleWorker from '@trezor/blockchain-link/lib/workers/ripple';
import BlockfrostWorker from '@trezor/blockchain-link/lib/workers/blockfrost';

import TrezorLink from '@trezor/transport';

const WebUsbPlugin = () =>
    new TrezorLink.Lowlevel(
        // @ts-expect-error TODO: https://github.com/trezor/trezor-suite/issues/5332
        new TrezorLink.WebUsb(),
        // @ts-expect-error TODO: https://github.com/trezor/trezor-suite/issues/5332
        typeof SharedWorker !== 'undefined' ? () => new SharedConnectionWorker() : null,
    );

const ReactNativeUsbPlugin = undefined;
const ElectrumWorker = undefined;

export {
    WebUsbPlugin,
    ReactNativeUsbPlugin,
    BlockbookWorker,
    RippleWorker,
    BlockfrostWorker,
    ElectrumWorker,
};
