import { BackendWebsocketServerMock } from '@trezor/e2e-utils';

import { allTestWorkers } from './__fixtures__/allTestWorkers';
import fixtures from './__fixtures__/getAccountInfo';

import { BlockchainLink } from './index';

allTestWorkers.forEach(instance => {
    describe(`getAccountInfo: ${instance.name}`, () => {
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
        beforeAll(setup);
        afterAll(teardown);

        // [btc-unknown-tx-debug] getAccountInfo parses tx history through transformTransaction, which
        // emits a temporary console.error for txs classified as 'unknown' with account context. Silence
        // the JestCustomEnv console.error trap for these fixtures.
        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });

        fixtures[instance.name].forEach(f => {
            it(f.description, async () => {
                server.setFixtures(f.serverFixtures);
                // @ts-expect-error incorrect params
                const promise = blockchain.getAccountInfo(f.params);
                if (!f.error) {
                    expect(await promise).toEqual(f.response);
                } else {
                    await expect(promise).rejects.toThrow(f.error);
                }
            });
        });

        // trezor/blockbook#1639: the privatePending hint must reach the WS request verbatim.
        if (instance.name === 'blockbook') {
            it('forwards the getAccountInfo privatePending hint verbatim to the backend', async () => {
                server.setFixtures([
                    {
                        method: 'getAccountInfo',
                        response: {
                            data: {
                                address: '0xdead',
                                balance: '0',
                                totalSent: '0',
                                totalReceived: '0',
                                txs: 0,
                                unconfirmedBalance: '0',
                                unconfirmedTxs: 0,
                            },
                        },
                    },
                ]);
                const received = new Promise<any>(resolve =>
                    server.once('blockbook_getAccountInfo', resolve),
                );

                // The response transform is irrelevant here — swallow it and assert the request only.
                const promise = blockchain
                    .getAccountInfo({
                        descriptor: '0xdead',
                        details: 'basic',
                        privatePending: { nonces: [41, 42], txids: ['0xaa', '0xbb'] },
                    })
                    .catch(() => undefined);

                const request = await received;
                expect(request.params.privatePending).toEqual({
                    nonces: [41, 42],
                    txids: ['0xaa', '0xbb'],
                });
                await promise;
            });
        }
    });
});
