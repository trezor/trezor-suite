import createServer from '../websocket';
import { rippleWorkerFactory, blockbookWorkerFactory } from './worker';
import BlockchainLink from '../../src';
import fixtures from './fixtures/getAccountInfo';

const backends = [
    {
        name: 'ripple',
        worker: rippleWorkerFactory,
    },
    {
        name: 'blockbook',
        worker: blockbookWorkerFactory,
    },
];

backends.forEach((b, i) => {
    describe(`getAccountInfo: ${b.name}`, () => {
        let server;
        let blockchain;

        const setup = async () => {
            server = await createServer(b.name);
            blockchain = new BlockchainLink({
                ...backends[i],
                server: [`ws://localhost:${server.options.port}`],
                debug: false,
            });
        };

        const teardown = () => {
            blockchain.dispose();
            server.close();
        };
        beforeAll(setup);
        afterAll(teardown);

        fixtures[b.name].forEach(f => {
            it(f.description, async () => {
                server.setFixtures(f.serverFixtures);
                const response = await blockchain.getAccountInfo(f.params);
                expect(response).toEqual(f.response);
            });
        });
    });
});
