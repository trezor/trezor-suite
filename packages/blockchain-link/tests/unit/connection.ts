import createServer from '../websocket';
import workers from './worker';
import BlockchainLink from '../../src';

workers.forEach(instance => {
    describe(`Connection ${instance.name}`, () => {
        let server: any;
        let blockchain: BlockchainLink;

        beforeEach(async () => {
            server = await createServer(instance.name);
            blockchain = new BlockchainLink({
                ...instance,
                server: [`ws://localhost:${server.options.port}`],
                debug: false,
            });
        });

        afterEach(async () => {
            await blockchain.disconnect();
            blockchain.dispose();
            await server.close();
        });

        it('Handle connection timeout', async () => {
            jest.setTimeout(10000);
            try {
                blockchain.settings.server = ['wss://google.com:11111', 'wss://google.com:22222'];
                blockchain.settings.timeout = 2500;
                await blockchain.connect();
            } catch (error) {
                expect(error.code).toEqual('blockchain_link/connect');
                expect(error.message).toEqual('All backends are down');
            }
        });

        it('Handle message timeout', async () => {
            jest.setTimeout(10000);
            server.setFixtures([
                {
                    method: instance.name === 'ripple' ? 'server_info' : 'getInfo',
                    response: undefined,
                    delay: 3000, // wait 3 sec. to send response
                },
            ]);
            try {
                blockchain.settings.timeout = 2500;
                await blockchain.getInfo();
            } catch (error) {
                expect(error.code).toEqual('blockchain_link/websocket_timeout');
            }
        });

        it('Handle ping (subscription)', async () => {
            // the only way how to test it is to check if server fixture was called
            // method defined in this fixture is the same which is used in ping function inside the worker
            // server should remove this fixture once called
            jest.setTimeout(10000);
            server.setFixtures([
                {
                    method: instance.name === 'ripple' ? 'server_info' : 'getBlockHash',
                    response: undefined,
                },
                {
                    method: instance.name === 'ripple' ? 'server_info' : 'getBlockHash',
                    response: undefined,
                },
            ]);
            blockchain.settings.pingTimeout = 2500; // ping message will be called 3 sec. after subscription
            await blockchain.subscribe({ type: 'block' });
            await new Promise(resolve => setTimeout(resolve, 6000));
            expect(server.fixtures).toEqual([]);
        });

        it('Handle ping (keepAlive)', async () => {
            // similar to previous test but this time expect that ping will be called because of "keepAlive" param
            jest.setTimeout(10000);
            server.setFixtures([
                {
                    method: instance.name === 'ripple' ? 'server_info' : 'getBlockHash',
                    response: undefined,
                },
                {
                    method: instance.name === 'ripple' ? 'server_info' : 'getBlockHash',
                    response: undefined,
                },
            ]);

            blockchain.settings.pingTimeout = 2500; // ping message will be called 3 sec. after subscription
            blockchain.settings.keepAlive = true;
            await blockchain.subscribe({ type: 'block' });
            await blockchain.unsubscribe({ type: 'block' });

            await new Promise(resolve => setTimeout(resolve, 6000));
            expect(server.fixtures).toEqual([]);
        });

        it('Ping should not be called and websocket should be disconnected', async () => {
            // similar to previous test but this time expect that server fixtures will not be removed
            // since ping should not be called because subscription was cancelled and keepAlive is not set
            // after first ping websocket should be disconnected
            jest.setTimeout(5000);
            server.setFixtures([
                {
                    method: instance.name === 'ripple' ? 'server_info' : 'getBlockHash',
                    response: undefined,
                },
                {
                    method: instance.name === 'ripple' ? 'server_info' : 'getBlockHash',
                    response: undefined,
                },
            ]);

            const callback = jest.fn();
            blockchain.on('disconnected', callback);

            blockchain.settings.pingTimeout = 2500; // ping message will be called 3 sec. after subscription
            await blockchain.subscribe({ type: 'block' });
            await blockchain.unsubscribe({ type: 'block' });

            await new Promise(resolve => setTimeout(resolve, 4000));

            expect(callback).toHaveBeenCalled();
            expect(server.fixtures.length).toEqual(2);
        });

        it('Handle connect event', async done => {
            jest.setTimeout(5000); // reset from previous test
            blockchain.on('connected', done);
            const result = await blockchain.connect();
            expect(result).toEqual(true);
        });

        it('Handle disconnect event', async done => {
            blockchain.on('disconnected', done);
            await blockchain.connect();
            // TODO: ripple-lib throws error when disconnect is called immediately
            // investigate more, use setTimeout as a workaround
            // Error [ERR_UNHANDLED_ERROR]: Unhandled error. (websocket)
            // at Connection.RippleAPI.connection.on (../../node_modules/ripple-lib/src/api.ts:133:14)
            if (instance.name === 'ripple') {
                setTimeout(() => blockchain.disconnect(), 1000);
            } else {
                blockchain.disconnect();
            }
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
            // @ts-ignore invalid server value
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

        it('Websocket connection closed without error before connection.open event', async () => {
            // auto reconnect RippleApi issue: https://github.com/ripple/ripple-lib/issues/1068
            server.removeAllListeners('connection');
            server.on('connection', (ws: any) => ws.close());

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
