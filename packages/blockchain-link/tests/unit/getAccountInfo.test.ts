import { BackendWebsocketServerMock } from '@trezor/e2e-utils';

import workers from './worker';
import { BlockchainLink } from '../../src';
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
    });
});
