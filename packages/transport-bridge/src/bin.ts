import { Log } from '@trezor/logger';

import { TrezordNode } from './http';

// The usb implementation is named explicitly: usb 3.x (nusb) stays opt-in while it is being
// validated, so the default is the frozen usb 2.x (legacy) baseline.
const getApi = () => {
    if (process.argv.includes('udp')) {
        return 'udp';
    }

    if (process.argv.includes('nusb')) {
        return 'nusb';
    }

    return 'legacy';
};

const trezordNode = new TrezordNode({
    api: getApi(),
    logger: new Log('@trezor/transport-bridge', true),
});

trezordNode.start();
