/* @flow */

import createServer from '../websocket';
import { rippleWorkerFactory, blockbookWorkerFactory } from './worker';
import BlockchainLink from '../../src';
import fixtures from './fixtures/getInfo';

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
    describe(`getInfo: ${b.name}`, () => {
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
                try {
                    const response = await blockchain.getInfo();
                    expect(response).toEqual(f.response);
                } catch (error) {
                    expect(error.message).toEqual(f.error);
                }
            });
        });
    });
});
