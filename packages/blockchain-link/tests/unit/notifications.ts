import createServer from '../websocket';
import { rippleWorkerFactory, blockbookWorkerFactory } from './worker';
import BlockchainLink from '../../src';

import fixturesRipple from './fixtures/notifications-ripple';
import fixturesBlockbook from './fixtures/notifications-blockbook';
import fixturesSubscribe from './fixtures/subscribe';

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

backends.forEach((b, i) => {
    describe(`Notifications ${b.name}`, () => {
        let server;
        let blockchain;

        const setup = async () => {
            server = await createServer(b.name);
            blockchain = new BlockchainLink({
                ...backends[i],
                server: [`ws://localhost:${server.options.port}`],
                debug: false,
            });
        };

        const teardown = () => {
            blockchain.dispose();
            server.close();
        };

        // this test covers the case where "subscribe" and "unsubscribe" is called
        // multiple times on single blockchain-link instance an subscription id is incremented in every call
        describe('Subscribed blocks with single blockchain-link instance', () => {
            beforeAll(setup);
            afterAll(teardown);

            b.fixtures.notifyBlocks.forEach(f => {
                it(f.description, async () => {
                    const callback = jest.fn();
                    blockchain.on('block', callback);
                    const s = await blockchain[f.method]({ type: 'block' });
                    expect(s).toEqual({ subscribed: f.method === 'subscribe' });
                    await server.sendMessage(f.server);
                    if (f.result) {
                        expect(callback).toHaveBeenCalledTimes(f.server.length);
                        expect(callback).toHaveBeenLastCalledWith(f.result);
                    } else {
                        expect(callback).not.toHaveBeenCalled();
                    }
                });
            });
        });

        // this test covers the case where "subscribe" and "unsubscribe" is called
        // multiple times on single blockchain-link instance an subscription id is incremented in every call
        describe('Subscribed addresses/accounts with single blockchain-link instance', () => {
            beforeAll(setup);
            afterAll(teardown);

            b.fixtures.notifyAddresses.forEach((f, id) => {
                it(f.description, async () => {
                    const callback = jest.fn();
                    blockchain.on('notification', callback);
                    const s = await blockchain[f.method](f.params);

                    expect(s).toEqual({ subscribed: f.method === 'subscribe' });
                    if (Array.isArray(f.server)) {
                        await server.sendMessage(f.server.map(a => ({ ...a, id: id.toString() })));
                    } else {
                        await server.sendMessage({ ...f.server, id: id.toString() });
                    }
                    if (f.result) {
                        expect(callback).toHaveBeenLastCalledWith(f.result);
                    } else {
                        expect(callback).not.toHaveBeenCalled();
                    }
                });
            });

            fixturesSubscribe.forEach(f => {
                it(f.description, async () => {
                    const s = await blockchain[f.method](f.params);
                    const subscribedAddresses = server.getAddresses();
                    const subscribed =
                        f.method === 'subscribe' ||
                        (subscribedAddresses && subscribedAddresses.length > 0) ||
                        false;
                    expect(s).toEqual({ subscribed });
                    expect(subscribedAddresses).toEqual(f.subscribed);
                });
            });
        });

        describe('Subscribe/Unsubscribe errors with single blockchain-link instance', () => {
            beforeAll(setup);
            afterAll(teardown);

            b.fixtures.subscribeErrors.forEach(f => {
                it(f.description, async () => {
                    server.setFixtures(f.server);

                    try {
                        await blockchain[f.method](f.params);
                    } catch (error) {
                        // expect(error.code).toEqual('blockchain_link/blockbook-websocket');
                        expect(error.message).toEqual(f.error);
                    }
                });
            });
        });

        describe('Blocks', () => {
            beforeEach(setup);
            afterEach(teardown);

            it('Unsubscribe before subscription', async () => {
                const resp = await blockchain.unsubscribe({ type: 'block' });
                expect(resp).toEqual({ subscribed: false });
            });

            it('Unsubscribe after subscription', async () => {
                await blockchain.subscribe({
                    type: 'block',
                });
                const resp = await blockchain.unsubscribe({
                    type: 'block',
                });
                expect(resp).toEqual({ subscribed: false });
            });
        });
    });
});
