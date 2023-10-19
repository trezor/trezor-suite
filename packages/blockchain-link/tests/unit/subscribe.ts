import { BackendWebsocketServerMock } from '@trezor/e2e-utils';
import workers from './worker';
import BlockchainLink from '../../src';
import fixtures from './fixtures/subscribe';

// this test covers application live cycle
// where "subscribe" and "unsubscribe" is called multiple times on single blockchain-link instance
// and subscription id (websocket message id) is incremented

workers.forEach(instance => {
    describe(`Subscriptions ${instance.name}`, () => {
        let server: BackendWebsocketServerMock;
        let blockchain: BlockchainLink;

        const setup = async () => {
            server = await BackendWebsocketServerMock.create(instance.name);
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
            // simplified server logic.
            // store requested addresses
            const subscribedAddresses: string[] = [];
            const initSubscription = () => {
                const unsubscribe = () => {
                    subscribedAddresses.splice(0);
                };
                const subscribe = (request: any) => {
                    // blockbook and blockfrost replaces current subscription
                    unsubscribe();
                    subscribedAddresses.push(...request.params.addresses);
                };

                server.on('blockbook_subscribeAddresses', subscribe);
                server.on('blockfrost_SUBSCRIBE_ADDRESS', subscribe);
                server.on('ripple_subscribe', request => {
                    if (Array.isArray(request.accounts_proposed)) {
                        subscribedAddresses.push(...request.accounts_proposed);
                    }
                });
                server.on('blockbook_unsubscribeAddresses', unsubscribe);
                server.on('blockfrost_UNSUBSCRIBE_ADDRESS', unsubscribe);
                server.on('ripple_unsubscribe', request => {
                    if (Array.isArray(request.accounts_proposed)) {
                        // unlike blockbook ripple is not clearing out whole state, it clears only requested one
                        request.accounts_proposed.forEach((address: string) => {
                            const index = subscribedAddresses.findIndex(a => a === address);
                            if (index >= 0) {
                                subscribedAddresses.splice(index, 1);
                            }
                        });
                    }
                });
            };

            beforeAll(() => setup().then(initSubscription));
            afterAll(teardown);

            fixtures.addresses.forEach(f => {
                it(f.description, async () => {
                    // @ts-expect-error incorrect params
                    const response = await blockchain[f.method](f.params);

                    const subscribed =
                        f.method === 'subscribe' ||
                        (subscribedAddresses && subscribedAddresses.length > 0) ||
                        false;

                    expect(response).toEqual({ subscribed });
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
                        // @ts-expect-error incorrect params
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
