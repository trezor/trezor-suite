import createServer, { EnhancedServer } from '../websocket';
import workers from './worker';
import BlockchainLink from '../../src';
import fixtures from './fixtures/getInfo';

workers.forEach(instance => {
    describe(`getInfo: ${instance.name}`, () => {
        let server: EnhancedServer;
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
        beforeAll(setup);
        afterAll(teardown);

        fixtures[instance.name].forEach(f => {
            it(f.description, async () => {
                server.setFixtures(f.serverFixtures);
                try {
                    const response = await blockchain.getInfo();
                    expect(response).toEqual({
                        ...f.response,
                        url: `ws://localhost:${server.options.port}`,
                    });
                } catch (error) {
                    expect(error.message).toEqual(f.error);
                }
            });
        });
    });
});
