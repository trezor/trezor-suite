import createServer from '../websocket';
import workers from './worker';
import BlockchainLink from '../../src';
import fixtures from './fixtures/subscribe';

// this test covers application live cycle
// where "subscribe" and "unsubscribe" is called multiple times on single blockchain-link instance
// and subscription id (websocket message id) is incremented

workers.forEach(instance => {
    describe(`Subscriptions ${instance.name}`, () => {
        let server: any;
        let blockchain: BlockchainLink;

        const setup = async () => {
            server = await createServer(instance.name);
            blockchain = new BlockchainLink({
                ...instance,
                server: [`ws://localhost:${server.options.port}`],
                debug: false,
            });
        };

        const teardown = async () => {
            await blockchain.disconnect();
            blockchain.dispose();
            await server.close();
        };

        describe('Compare subscribed addresses/accounts with server', () => {
            beforeAll(setup);
            afterAll(teardown);

            fixtures.addresses.forEach(f => {
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

        describe('Subscribe error', () => {
            beforeAll(setup);
            afterAll(teardown);

            fixtures.errors.forEach(f => {
                it(f.description, async () => {
                    // server.setFixtures(f.server);
                    try {
                        await blockchain[f.method](f.params);
                    } catch (error) {
                        // expect(error.code).toEqual('blockchain_link/blockbook-websocket');
                        expect(error.message).toEqual(f.error);
                    }
                });
            });
        });

        describe('Subscribe block', () => {
            beforeAll(setup);
            afterAll(teardown);

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
