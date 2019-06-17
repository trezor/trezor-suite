/* @flow */

// import chai, { expect, should } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import chai, { expect, should } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import createServer, { setFixture } from './websocket/blockbook';
import { blockbookWorkerFactory } from './workers/mock.worker';
import BlockchainLink from '../src';

should();
chai.use(chaiAsPromised);

describe('Blockbook', () => {
    let server;
    let blockchain;

    beforeEach(async () => {
        setFixture(); // reset response custom fixture
        server = await createServer();
        blockchain = new BlockchainLink({
            name: 'Tests:Blockbook',
            worker: blockbookWorkerFactory,
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

    it('Connect error (no server field)', async () => {
        // $FlowIssue
        blockchain.settings.server = null;
        try {
            await blockchain.connect();
        } catch (error) {
            expect(error).to.be.an('error');
        }
    });

    it('Connect error (server field empty)', async () => {
        blockchain.settings.server = [];
        try {
            await blockchain.connect();
        } catch (error) {
            expect(error).to.be.an('error');
        }
    });

    it('Connect error (server field invalid type)', async () => {
        // $FlowIssue
        blockchain.settings.server = 1;
        try {
            await blockchain.connect();
        } catch (error) {
            expect(error).to.be.an('error');
        }
    });

    it('Get info', async () => {
        setFixture('valid');
        const result = await blockchain.getInfo();
        expect(result).to.deep.equal({ name: 'Test', shortcut: 'test', decimals: 9, block: 1 });
    });

    it('Get info error', async () => {
        setFixture('invalid');
        try {
            await blockchain.getInfo();
            // done('failed');
        } catch (error) {
            expect(error).to.be.an('error');
        }
    });
});
