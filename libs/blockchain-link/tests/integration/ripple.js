import BlockchainLink from '@trezor/blockchain-link';
import createServer from '../websocket';
import { rippleWorkerFactory } from './worker';

describe('Ripple', () => {
    let server;
    let blockchain;

    beforeEach(async () => {
        server = await createServer('ripple');
        blockchain = new BlockchainLink({
            name: 'Tests:Ripple',
            worker: rippleWorkerFactory,
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

    it('Connect (one input is invalid)', async () => {
        blockchain.settings.server = ['gibberish'].concat(blockchain.settings.server);

        const result = await blockchain.connect();
        expect(result).toEqual(true);
    });

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

    it('Connect error (no server field)', async () => {
        blockchain.settings.server = null;
        try {
            await blockchain.connect();
        } catch (error) {
            expect(error.code).toEqual('blockchain_link/connect');
        }
    });

    it('Connect error (server field empty)', async () => {
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
            // expect(error.code).equals('blockchain_link/connect');
            expect(error.message).toEqual('All backends are down');
        }
    });

    it('Get fee', async () => {
        const result = await blockchain.estimateFee();
        expect(result).toEqual([{ name: 'Normal', value: '12' }]);
    });
});
