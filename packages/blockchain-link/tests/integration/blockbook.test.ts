import { BackendWebsocketServerMock } from '@trezor/e2e-utils';
import BlockchainLink from '../../lib';
import { blockbookWorkerFactory, blockbookModuleFactory } from './worker';

const backends = [
    {
        name: 'nodejs-build:blockbook',
        type: 'blockbook',
        worker: blockbookWorkerFactory,
    },
    {
        name: 'module-build:blockbook',
        type: 'blockbook',
        worker: blockbookModuleFactory,
    },
];

backends.forEach(b => {
    describe(`Blockbook ${b.name}`, () => {
        let server: BackendWebsocketServerMock;
        let blockchain: BlockchainLink;

        beforeEach(async () => {
            server = await BackendWebsocketServerMock.create('blockbook');
            blockchain = new BlockchainLink({
                name: b.name,
                worker: b.worker,
                server: [`ws://localhost:${server.options.port}`],
                debug: false,
            });
        });

        afterEach(() => {
            blockchain.dispose();
            server.close();
        });

        it('Get info', async () => {
            const result = await blockchain.getInfo();
            expect(result).toEqual({
                name: 'TestMock',
                shortcut: 'test',
                decimals: 9,
                blockHeight: 1,
                url: expect.any(String),
            });
        });

        it('Get info error', async () => {
            try {
                await blockchain.getInfo();
            } catch (error) {
                expect(error.code).toEqual('blockchain_link/response');
                // // expect(error.message).toEqual('Unexpected response');
            }
        });
    });
});
