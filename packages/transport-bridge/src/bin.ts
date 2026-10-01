import { Log } from '@trezor/logger';

import { TrezordNode } from './http';

const trezordNode = new TrezordNode({
    api: process.argv.includes('udp') ? 'udp' : 'usb',
    logger: new Log('@trezor/transport-bridge', true),
});

trezordNode.start();
