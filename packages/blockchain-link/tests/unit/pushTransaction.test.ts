import { BackendWebsocketServerMock } from '@trezor/e2e-utils';
import workers from './worker';
import BlockchainLink from '../../src';
import fixtures from './fixtures/pushTransaction';

workers.forEach(instance => {
    describe(`pushTransaction: ${instance.name}`, () => {
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
                const promise = blockchain.pushTransaction(f.params);
                if (!f.error) {
                    expect(await promise).toEqual(f.response);
                } else {
                    await expect(promise).rejects.toThrow(f.error);
                }
            });
        });
    });
});
