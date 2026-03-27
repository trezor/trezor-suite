import { BlockchainLink } from '@trezor/blockchain-link';
import { BackendWebsocketServerMock } from '@trezor/e2e-utils';

import RippleWorker from '../src';

describe('Connection (Ripple)', () => {
    let server: BackendWebsocketServerMock;
    let blockchain: BlockchainLink;

    beforeEach(async () => {
        server = await BackendWebsocketServerMock.create('ripple');
        blockchain = new BlockchainLink({
            name: 'Ripple',
            worker: RippleWorker,
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
        it('Handle connect event', () =>
            new Promise<void>(done => {
                blockchain.on('connected', () => done());
                blockchain.connect();
            }));

        it('Handle disconnect event', () =>
            new Promise<void>(done => {
                blockchain.on('disconnected', () => done());
                blockchain.connect().then(() => {
                    blockchain.disconnect();
                });
            }));
    });
});
