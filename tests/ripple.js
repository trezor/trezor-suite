/* @flow */

// import Promise from 'es6-promise';
// import chai, { expect, should } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import chai, { expect, should } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import createServer from './websocket/ripple';
import { rippleWorkerFactory } from './workers/mock.worker';
// import { MESSAGES, RESPONSES } from '../src/constants';
import BlockchainLink from '../src';

should();
chai.use(chaiAsPromised);

describe('Ripple', () => {
    let server;
    let blockchain;

    beforeEach(async () => {
        server = await createServer();
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
        expect(result).to.deep.equal(true);
    });

    it('Connect (one input is invalid)', async () => {
        blockchain.settings.server = ['gibberish'].concat(blockchain.settings.server);

        const result = await blockchain.connect();
        expect(result).equal(true);
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
        // $FlowIssue
        blockchain.settings.server = null;
        try {
            await blockchain.connect();
        } catch (error) {
            expect(error.code).equals('blockchain_link/connect');
        }
    });

    it('Connect error (server field empty)', async () => {
        blockchain.settings.server = [];
        try {
            await blockchain.connect();
        } catch (error) {
            expect(error.code).equals('blockchain_link/connect');
        }
    });

    it('Connect error (server field invalid type)', async () => {
        // $FlowIssue
        blockchain.settings.server = 1;
        try {
            await blockchain.connect();
        } catch (error) {
            expect(error.code).equals('blockchain_link/connect');
        }
    });

    it('Connect error (server field with invalid values)', async () => {
        // $FlowIssue
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
            expect(error.message).equals('All backends are down');
        }
    });

    it('Get fee', async () => {
        const result = await blockchain.estimateFee();
        expect(result).to.deep.equal([{ name: 'Normal', value: '12' }]);
    });
});
