import { Log } from '@trezor/utils';

import { TrezordNode } from './http';

const trezordNode = new TrezordNode({
    port: 21325,
    api: 'usb',
    logger: new Log('@trezor/transport-bridge', true),
});

trezordNode.start();
