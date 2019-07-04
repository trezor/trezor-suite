import createServer from '../websocket';
import { rippleWorkerFactory, blockbookWorkerFactory } from './worker';
import BlockchainLink from '../../src';

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

backends.forEach(instance => {
    describe(`Connection ${instance.name}`, () => {
        let server;
        let blockchain: BlockchainLink;

        beforeEach(async () => {
            server = await createServer(instance.name);
            blockchain = new BlockchainLink({
                ...instance,
                server: [`ws://localhost:${server.options.port}`],
                debug: false,
            });
        });

        afterEach(() => {
            blockchain.dispose();
            server.close();
        });

        it('Handle connect event', async done => {
            blockchain.on('connected', done);
            const result = await blockchain.connect();
            expect(result).toEqual(true);
        });

        it('Handle disconnect event', async done => {
            // blockchain.on('disconnected', () => setTimeout(done, 300));
            blockchain.on('disconnected', done);
            await blockchain.connect();
            // TODO: ripple-lib throws error when disconnect is called immediately
            // investigate more, use setTimeout as a workaround
            // Error [ERR_UNHANDLED_ERROR]: Unhandled error. (websocket)
            // at Connection.RippleAPI.connection.on (../../node_modules/ripple-lib/src/api.ts:133:14)
            if (instance.name === 'ripple') {
                setTimeout(blockchain.disconnect, 100);
            } else {
                blockchain.disconnect();
            }

            // blockchain.connect().then(() => {
            //     setTimeout(() => blockchain.disconnect(), 100);
            //     setTimeout(() => blockchain.disconnect(), 200);
            //     // blockchain.disconnect();
            // });
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
            // @ts-ignore invalid value
            blockchain.settings.server = 1;
            try {
                await blockchain.connect();
            } catch (error) {
                expect(error.code).toEqual('blockchain_link/connect');
            }
        });

        it('Disconnect without connection', async () => {
            const r = await blockchain.disconnect();
            expect(r).toEqual(true);
        });

        it('Connect error (server field with invalid values)', async () => {
            blockchain.settings.server = [
                'gibberish',
                'ws://gibberish',
                'http://gibberish',
                'https://gibberish/',
                // @ts-ignore invalid value
                1,
                // @ts-ignore invalid value
                false,
                // @ts-ignore invalid value
                { foo: 'bar' },
            ];
            try {
                await blockchain.connect();
            } catch (error) {
                expect(error.message).toEqual('All backends are down');
            }
        });
    });
});
