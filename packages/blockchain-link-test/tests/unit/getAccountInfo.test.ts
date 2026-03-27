import { BlockchainLink } from '@trezor/blockchain-link';
import { BackendWebsocketServerMock } from '@trezor/e2e-utils';

import fixtures from './fixtures/getAccountInfo';
import workers from './worker';

workers.forEach(instance => {
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
    });
});
