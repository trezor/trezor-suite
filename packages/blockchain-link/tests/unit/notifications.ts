import createServer from '../websocket';
import { rippleWorkerFactory, blockbookWorkerFactory } from './worker';
import BlockchainLink from '../../src';

import fixturesRipple from './fixtures/notifications-ripple';
import fixturesBlockbook from './fixtures/notifications-blockbook';

const backends = [
    {
        name: 'ripple',
        worker: rippleWorkerFactory,
        fixtures: fixturesRipple,
    },
    {
        name: 'blockbook',
        worker: blockbookWorkerFactory,
        fixtures: fixturesBlockbook,
    },
];

// this test covers application live cycle
// where "subscribe" and "unsubscribe" is called multiple times on single blockchain-link instance
// and subscription id (websocket message id) is incremented

backends.forEach(instance => {
    describe(`Notifications ${instance.name}`, () => {
        let server;
        let blockchain: BlockchainLink;

        const setup = async () => {
            server = await createServer(instance.name);
            blockchain = new BlockchainLink({
                ...instance,
                server: [`ws://localhost:${server.options.port}`],
                debug: false,
            });
        };

        const teardown = () => {
            blockchain.dispose();
            server.close();
        };

        describe('Addresses and accounts', () => {
            beforeAll(setup);
            afterAll(teardown);

            instance.fixtures.notifyAddresses.forEach((f, id) => {
                it(f.description, async () => {
                    const callback = jest.fn();
                    blockchain.on('notification', callback);
                    const s = await blockchain[f.method](f.params);

                    expect(s).toEqual({ subscribed: f.method === 'subscribe' });

                    const data = (!Array.isArray(f.notifications)
                        ? [f.notifications]
                        : f.notifications
                    ).map(n => ({
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

            instance.fixtures.notifyBlocks.forEach(f => {
                it(f.description, async () => {
                    const callback = jest.fn();
                    blockchain.on('block', callback);
                    const s = await blockchain[f.method]({ type: 'block' });
                    expect(s).toEqual({ subscribed: f.method === 'subscribe' });

                    await server.sendNotification(f.notifications);

                    if (f.result) {
                        expect(callback).toHaveBeenCalledTimes(f.notifications.length);
                        expect(callback).toHaveBeenLastCalledWith(f.result);
                    } else {
                        expect(callback).not.toHaveBeenCalled();
                    }
                });
            });
        });
    });
});
