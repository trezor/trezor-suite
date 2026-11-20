import { Log } from '@trezor/logger';

import { TrezordNode } from './http';

// The usb implementation is named explicitly: usb 3.x (nusb) stays opt-in while it is being
// validated, so the default is the frozen usb 2.x (legacy) baseline.
const getApi = () => {
    if (process.argv.includes('udp')) {
        return 'udp';
    }

    if (process.argv.includes('hid')) {
        return 'hid';
    }

    if (process.argv.includes('nusb')) {
        return 'nusb';
    }

    return 'legacy';
};

// Development only, e.g. `hid --port=21329 --origin=localhost` runs a bridge for HID-only
// Trezor One devices that only pages served from localhost can use.
const getArgValues = (name: string) =>
    process.argv
        .filter(arg => arg.startsWith(`--${name}=`))
        .map(arg => arg.slice(`--${name}=`.length));

const allowedOrigins = getArgValues('origin');
const [portArg] = getArgValues('port');
const port = portArg !== undefined ? Number(portArg) : undefined;

const logger = new Log('@trezor/transport-bridge', true);

if (port !== undefined && !(Number.isInteger(port) && port > 0 && port < 65536)) {
    logger.error(`invalid --port=${portArg}`);
    process.exit(1);
}

const trezordNode = new TrezordNode({
    api: getApi(),
    logger,
    port,
    allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : undefined,
});

trezordNode.start();
