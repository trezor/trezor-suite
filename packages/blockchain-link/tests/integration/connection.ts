import { BackendWebsocketServerMock } from '@trezor/e2e-utils';
import BlockchainLink from '../../lib';
import {
    rippleWorkerFactory,
    rippleModuleFactory,
    blockbookWorkerFactory,
    blockbookModuleFactory,
    blockfrostWorkerFactory,
    blockfrostModuleFactory,
} from './worker';

// Testing each build using same scenarios (connection + events)

const backends = [
    {
        name: 'nodejs-build:blockbook',
        type: 'blockbook',
        worker: blockbookWorkerFactory,
    },
    {
        name: 'nodejs-build:ripple',
        type: 'ripple',
        worker: rippleWorkerFactory,
    },
    {
        name: 'nodejs-build:blockfrost',
        type: 'blockfrost',
        worker: blockfrostWorkerFactory,
    },
    {
        name: 'module-build:blockbook',
        type: 'blockbook',
        worker: blockbookModuleFactory,
    },
    {
        name: 'module-build:ripple',
        type: 'ripple',
        worker: rippleModuleFactory,
    },
    {
        name: 'module-build:blockfrost',
        type: 'blockfrost',
        worker: blockfrostModuleFactory,
    },
] as const;

backends.forEach((b, i) => {
    describe(`Connection ${b.name}`, () => {
        let server: BackendWebsocketServerMock;
        let blockchain: BlockchainLink;

        beforeEach(async () => {
            server = await BackendWebsocketServerMock.create(b.type);
            blockchain = new BlockchainLink({
                ...backends[i],
                timeout: 1000,
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
            // @ts-expect-error invalid value
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
            // @ts-expect-error invalid value
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
                // @ts-expect-error invalid value
                1,
                // @ts-expect-error invalid value
                false,
                // @ts-expect-error invalid value
                { foo: 'bar' },
            ];
            try {
                await blockchain.connect();
            } catch (error) {
                expect(error.message).toEqual('All backends are down');
            }
        }, 10000);

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
