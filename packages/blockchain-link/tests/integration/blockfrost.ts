import { BackendWebsocketServerMock } from '@trezor/e2e-utils';
import BlockchainLink from '../../lib';
import { blockfrostWorkerFactory, blockfrostModuleFactory } from './worker';

const backends = [
    {
        name: 'nodejs-build:blockfrost',
        type: 'blockfrost',
        worker: blockfrostWorkerFactory,
    },
    {
        name: 'module-build:blockfrost',
        type: 'blockfrost',
        worker: blockfrostModuleFactory,
    },
];

backends.forEach(b => {
    describe(`Blockfrost ${b.name}`, () => {
        let server: BackendWebsocketServerMock;
        let blockchain: BlockchainLink;

        beforeEach(async () => {
            server = await BackendWebsocketServerMock.create('blockfrost');
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
                name: 'BlockfrostMock',
                shortcut: 'ada',
                decimals: 6,
                blockHeight: 1,
                blockHash: 'test_block_hash-hash',
                testnet: false,
                url: expect.any(String),
                version: '1.4.0',
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
