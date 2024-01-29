import { BackendWebsocketServerMock } from '@trezor/e2e-utils';
import workers from './worker';
import BlockchainLink from '../../src';

import fixturesBlockbook from './fixtures/notifications-blockbook';
import fixturesRipple from './fixtures/notifications-ripple';
import fixturesBlockfrost from './fixtures/notifications-blockfrost';

const fixtures = {
    blockbook: fixturesBlockbook,
    ripple: fixturesRipple,
    blockfrost: fixturesBlockfrost,
} as const;

// this test covers application live cycle
// where "subscribe" and "unsubscribe" is called multiple times on single blockchain-link instance
// and subscription id (websocket message id) is incremented

workers.forEach(instance => {
    describe(`Notifications ${instance.name}`, () => {
        let server: BackendWebsocketServerMock;
        let blockchain: BlockchainLink;

        const setup = async () => {
            server = await BackendWebsocketServerMock.create(instance.name);
            blockchain = new BlockchainLink({
                ...instance,
                server: [`ws://localhost:${server.options.port}`],
                debug: false,
                throttleBlockEvent: 50,
            });
        };

        const teardown = async () => {
            await blockchain.disconnect();
            blockchain.dispose();
            await server.close();
        };

        describe('Addresses and accounts', () => {
            beforeAll(setup);
            afterAll(teardown);

            // NOTE: do not skip any test because id's sequence must be continuous!
            fixtures[instance.name].notifyAddresses.forEach((f, id) => {
                it(f.description, async () => {
                    const callback = jest.fn();
                    blockchain.on('notification', callback);
                    // @ts-expect-error incorrect params
                    const s = await blockchain[f.method](f.params);

                    expect(s).toEqual({
                        subscribed: f.method === 'subscribe',
                    });

                    const data = (
                        Array.isArray(f.notifications) ? [...f.notifications] : [f.notifications]
                    ).map((n: any) => ({
                        ...n,
                        id: id.toString(),
                    }));

                    await server.sendNotification(data);

                    if (f.result) {
                        expect(callback).toHaveBeenLastCalledWith(f.result);
                    } else {
                        expect(callback).not.toHaveBeenCalled();
                    }
                });
            });
        });

        describe('Blocks', () => {
            beforeAll(setup);
            afterAll(teardown);

            fixtures[instance.name].notifyBlocks.forEach(f => {
                it(f.description, async () => {
                    const callback = jest.fn();
                    blockchain.on('block', callback);
                    const s = await blockchain[f.method]({ type: 'block' });

                    expect(s).toEqual({ subscribed: f.method === 'subscribe' });

                    await server.sendNotification(f.notifications as any);

                    // wait for block event throttling
                    await new Promise(resolve => {
                        setTimeout(resolve, blockchain.settings.throttleBlockEvent);
                    });

                    if (f.result) {
                        expect(callback).toHaveBeenCalledTimes(f.notificationsCount);
                        expect(callback).toHaveBeenLastCalledWith(f.result);
                    } else {
                        expect(callback).not.toHaveBeenCalled();
                    }
                });
            });
        });
    });
});
