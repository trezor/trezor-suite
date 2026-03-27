import { BlockchainLink } from '@trezor/blockchain-link';
import { BackendWebsocketServerMock } from '@trezor/e2e-utils';

import fixtures from './fixtures/getInfo';
import workers from './worker';

workers.forEach(instance => {
    describe(`getInfo: ${instance.name}`, () => {
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
                const promise = blockchain.getInfo();
                if (!f.error) {
                    expect(await promise).toEqual({
                        ...f.response,
                        url: `ws://localhost:${server.options.port}`,
                    });
                } else {
                    await expect(promise).rejects.toThrow(f.error);
                }
            });
        });
    });
});
