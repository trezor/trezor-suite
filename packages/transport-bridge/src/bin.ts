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

// Development only: `--hid-origin=http://localhost:5181` lets the page served from that origin
// use HID-only Trezor One devices, see `TrezordNode` `hid` settings.
const HID_ORIGIN_ARG = '--hid-origin=';

const getHidOrigins = () =>
    process.argv
        .filter(arg => arg.startsWith(HID_ORIGIN_ARG))
        .map(arg => arg.slice(HID_ORIGIN_ARG.length));

const hidOrigins = getHidOrigins();

const trezordNode = new TrezordNode({
    api: getApi(),
    logger: new Log('@trezor/transport-bridge', true),
    hid: hidOrigins.length > 0 ? { origins: hidOrigins } : undefined,
});

trezordNode.start();
