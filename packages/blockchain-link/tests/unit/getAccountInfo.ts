import { BackendWebsocketServerMock } from '@trezor/e2e-utils';
import workers from './worker';
import BlockchainLink from '../../src';
import fixtures from './fixtures/getAccountInfo';

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
                try {
                    // @ts-expect-error incorrect params
                    const response = await blockchain.getAccountInfo(f.params);
                    expect(response).toEqual(f.response);
                } catch (error) {
                    expect(error.message).toEqual(f.error);
                }
            });
        });
    });
});
