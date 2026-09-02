import { BackendWebsocketServerMock } from '@trezor/e2e-utils';

import { allTestWorkers } from './__fixtures__/allTestWorkers';
import fixtures from './__fixtures__/estimateFee';

import { BlockchainLink } from './index';

allTestWorkers.forEach(instance => {
    describe(`estimateFee: ${instance.name}`, () => {
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

        fixtures[instance.name].forEach(f => {
            it(f.description, async () => {
                server.setFixtures(f.serverFixtures);
                // @ts-expect-error
                const promise = blockchain.estimateFee(f.params);
                if (!f.error) {
                    expect(await promise).toEqual(f.response);
                } else {
                    await expect(promise).rejects.toThrow(f.error);
                }
            });
        });

        // trezor/blockbook#1639: the privatePending hint must reach the WS request verbatim.
        if (instance.name === 'blockbook') {
            it('forwards the estimateFee privatePending hint verbatim to the backend', async () => {
                server.setFixtures([
                    { method: 'estimateFee', response: { data: [{ feePerUnit: '1000' }] } },
                ]);
                const received = new Promise<any>(resolve =>
                    server.once('blockbook_estimateFee', resolve),
                );

                await blockchain.estimateFee({
                    blocks: [1],
                    specific: {
                        from: '0xdead',
                        privatePending: { nonces: [41, 42], txids: ['0xaa', '0xbb'] },
                    },
                });

                const request = await received;
                expect(request.params.specific.privatePending).toEqual({
                    nonces: [41, 42],
                    txids: ['0xaa', '0xbb'],
                });
            });
        }
    });
});
