import BlockchainLink from '@trezor/blockchain-link';
import createServer from '../websocket';
import { rippleWorkerFactory, blockbookWorkerFactory } from './worker';

const backends = [
    {
        name: 'blockbook',
        worker: blockbookWorkerFactory,
    },
    {
        name: 'ripple',
        worker: rippleWorkerFactory,
    },
];

backends.forEach((b, i) => {
    describe(`Connection ${b.name}`, () => {
        let server;
        let blockchain;

        beforeEach(async () => {
            server = await createServer(b.name);
            blockchain = new BlockchainLink({
                ...backends[i],
                server: [`ws://localhost:${server.options.port}`],
                debug: false,
            });
        });

        afterEach(() => {
            blockchain.dispose();
            server.close();
        });

        it('Connect', async () => {
            const result = await blockchain.connect();
            expect(result).toEqual(true);
        });

        it('Connect (only one endpoint is valid)', async () => {
            blockchain.settings.server = [
                'gibberish1',
                'gibberish2',
                'gibberish3',
                'gibberish4',
            ].concat(blockchain.settings.server);

            const result = await blockchain.connect();
            expect(result).toEqual(true);
        });

        it('Connect error (no server field)', async () => {
            blockchain.settings.server = null;
            try {
                await blockchain.connect();
            } catch (error) {
                expect(error.code).toEqual('blockchain_link/connect');
            }
        });

        it('Connect error (server field empty array)', async () => {
            blockchain.settings.server = [];
            try {
                await blockchain.connect();
            } catch (error) {
                expect(error.code).toEqual('blockchain_link/connect');
            }
        });

        it('Connect error (server field invalid type)', async () => {
            blockchain.settings.server = 1;
            try {
                await blockchain.connect();
            } catch (error) {
                expect(error.code).toEqual('blockchain_link/connect');
            }
        });

        it('Connect error (server field with invalid values)', async () => {
            blockchain.settings.server = [
                'gibberish',
                'ws://gibberish',
                'http://gibberish',
                1,
                false,
                { foo: 'bar' },
            ];
            try {
                await blockchain.connect();
            } catch (error) {
                expect(error.message).toEqual('All backends are down');
            }
        });

        describe('Event listeners', () => {
            it('Handle connect event', done => {
                blockchain.on('connected', () => done());
                blockchain.connect();
            });

            it('Handle disconnect event', done => {
                blockchain.on('disconnected', () => done());
                blockchain.connect().then(() => {
                    blockchain.disconnect();
                });
            });
        });
    });
});
