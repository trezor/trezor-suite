import createServer from '../websocket';
import workers from './worker';
import BlockchainLink from '../../src';
import fixtures from './fixtures/getAccountUtxo';

workers.forEach(instance => {
    describe(`getAccountUtxo: ${instance.name}`, () => {
        let server;
        let blockchain;

        const setup = async () => {
            server = await createServer(instance.name);
            blockchain = new BlockchainLink({
                ...instance,
                server: [`ws://localhost:${server.options.port}`],
                debug: false,
            });
        };

        const teardown = async () => {
            blockchain.dispose();
            await server.close();
        };
        beforeAll(setup);
        afterAll(teardown);

        fixtures[instance.name].forEach(f => {
            it(f.description, async () => {
                server.setFixtures(f.serverFixtures);
                try {
                    const response = await blockchain.getAccountUtxo(f.params);
                    expect(response).toEqual(f.response);
                } catch (error) {
                    expect(error.message).toEqual(f.error);
                }
            });
        });
    });
});
