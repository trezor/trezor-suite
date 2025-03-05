/* eslint-disable jest/no-jasmine-globals */
import { TimeoutError } from 'xrpl';

import { BackendWebsocketServerMock } from '@trezor/e2e-utils';

import workers from './worker';
import BlockchainLink from '../../src';

const getMethod = (instanceName: string) => {
    let method: string;
    switch (instanceName) {
        case 'blockfrost':
            method = 'GET_BLOCK';
            break;
        case 'ripple':
            method = 'server_info';
            break;
        default:
            method = 'getBlockHash';
            break;
    }

    return method;
};

workers.forEach(instance => {
    describe(`Connection ${instance.name}`, () => {
        let server: BackendWebsocketServerMock;
        let blockchain: BlockchainLink;

        beforeEach(async () => {
            server = await BackendWebsocketServerMock.create(instance.name);
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
            try {
                blockchain.settings.server = ['wss://google.com:11111', 'wss://google.com:22222'];
                blockchain.settings.timeout = 200;
                await blockchain.connect();
                fail('Did not throw');
            } catch (error) {
                expect(error.code).toEqual('blockchain_link/connect');
                expect(error.message).toEqual('All backends are down');
            }
        }, 9000);

        it('Handle message timeout', async () => {
            server.setFixtures([
                {
                    method: {
                        blockbook: 'getInfo',
                        blockfrost: 'GET_SERVER_INFO',
                        ripple: 'server_info',
                    }[instance.name],
                    response: undefined,
                    delay: 400, // wait 0.4 sec. to send response
                },
            ]);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            blockchain.settings.timeout = 200;

            try {
                await blockchain.getInfo();
                fail('Did not throw');
            } catch (error) {
                if (instance.name === 'ripple') {
                    expect(consoleSpy).toHaveBeenCalled();
                    expect(consoleSpy).toHaveBeenCalledWith(expect.any(TimeoutError));
                } else {
                    expect(error.code).toEqual('blockchain_link/websocket_timeout');
                }
            } finally {
                consoleSpy.mockRestore();
            }
        });

        it('Handle ping (subscription)', async () => {
            const method = getMethod(instance.name);
            // the only way how to test it is to check if server fixture was called
            // method defined in this fixture is the same which is used in ping function inside the worker
            // server should remove this fixture once called
            server.setFixtures([
                { method, response: undefined },
                { method, response: undefined },
            ]);
            blockchain.settings.pingTimeout = 200; // ping message will be called 0.2 sec. after subscription
            await blockchain.subscribe({ type: 'block' });
            await new Promise(resolve => setTimeout(resolve, 500));
            expect(server.fixtures).toEqual([]);
        }, 7000);

        it('Handle ping (keepAlive)', async () => {
            const method = getMethod(instance.name);
            // similar to previous test but this time expect that ping will be called because of "keepAlive" param
            server.setFixtures([
                { method, response: undefined },
                { method, response: undefined },
            ]);

            blockchain.settings.pingTimeout = 200; // ping message will be called 0.2 sec. after subscription
            blockchain.settings.keepAlive = true;
            await blockchain.subscribe({ type: 'block' });
            await blockchain.unsubscribe({ type: 'block' });

            await new Promise(resolve => setTimeout(resolve, 500));
            expect(server.fixtures).toEqual([]);
        }, 7000);

        it('Ping should not be called and websocket should be disconnected', async () => {
            const method = getMethod(instance.name);
            // similar to previous test but this time expect that server fixtures will not be removed
            // since ping should not be called because subscription was cancelled and keepAlive is not set
            // after first ping websocket should be disconnected
            server.setFixtures([
                { method, response: undefined },
                { method, response: undefined },
            ]);

            const callback = jest.fn();
            blockchain.on('disconnected', callback);

            blockchain.settings.pingTimeout = 200; // ping message will be called 0.2 sec. after subscription
            await blockchain.subscribe({ type: 'block' });
            await blockchain.unsubscribe({ type: 'block' });

            await new Promise(resolve => setTimeout(resolve, 500));

            expect(callback).toHaveBeenCalled();

            // xrpl.js calls this.getServerInfo() inside the connect() method,
            // which results in the mock server sending a response and then removing the first fixture
            if (instance.name === 'ripple') {
                expect(server.getFixtures()!.length).toEqual(1);
            } else {
                expect(server.getFixtures()!.length).toEqual(2);
            }
        });

        it('Handle connect event', () =>
            new Promise<void>(done => {
                blockchain.on('connected', done);
                blockchain.connect().then(result => {
                    expect(result).toEqual(true);
                });
            }));

        it('Handle disconnect event', () =>
            new Promise<void>(done => {
                blockchain.on('disconnected', done);
                blockchain.connect().then(() => {
                    blockchain.disconnect();
                });
            }));

        it('Connect (only one endpoint is valid)', async () => {
            // blockfrost has only one valid endpoint
            if (instance.name === 'blockfrost') return;

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
            // @ts-expect-error invalid server value
            blockchain.settings.server = null;
            try {
                await blockchain.connect();
                fail('Did not throw');
            } catch (error) {
                expect(error.code).toEqual('blockchain_link/connect');
            }
        });

        it('Connect error (server field empty array)', async () => {
            blockchain.settings.server = [];
            try {
                await blockchain.connect();
                fail('Did not throw');
            } catch (error) {
                expect(error.code).toEqual('blockchain_link/connect');
            }
        });

        it('Connect error (server field invalid type)', async () => {
            // @ts-expect-error invalid value
            blockchain.settings.server = 1;
            try {
                await blockchain.connect();
                fail('Did not throw');
            } catch (error) {
                expect(error.code).toEqual('blockchain_link/connect');
            }
        });

        it('Disconnect without connection', async () => {
            const r = await blockchain.disconnect();
            expect(r).toEqual(true);
        });

        it('Connect error (server field with invalid values)', async () => {
            blockchain.settings.timeout = 200;
            blockchain.settings.server = [
                'gibberish',
                'ws://gibberish',
                'http://gibberish',
                'https://gibberish/',
                // @ts-expect-error invalid value
                1,
                // @ts-expect-error invalid value
                false,
                // @ts-expect-error invalid value
                { foo: 'bar' },
            ];
            try {
                await blockchain.connect();
                fail('Did not throw');
            } catch (error) {
                expect(error.message).toEqual('All backends are down');
            }
        });
    });
});
