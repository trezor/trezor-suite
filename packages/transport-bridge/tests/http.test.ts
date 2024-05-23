import { getFreePort } from '@trezor/node-utils';

import { TrezordNode } from '../src/http';

const muteLogger = {
    info: (..._args: string[]) => {},
    debug: (..._args: string[]) => {},
    log: (..._args: string[]) => {},
    warn: (..._args: string[]) => {},
    error: (..._args: string[]) => {},
};

describe('http', () => {
    let port: number;
    beforeAll(async () => {
        port = await getFreePort();
    });

    (['usb', 'udp'] as const).forEach(api => {
        it(`node bridge using ${api} api should start and stop without stopping jest from exiting`, async () => {
            const trezordNode = new TrezordNode({
                port,
                api,
                // @ts-expect-error
                logger: muteLogger,
            });
            await trezordNode.start();
            await trezordNode.stop();
        });
    });
});
