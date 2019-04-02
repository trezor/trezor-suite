/* @flow */

import Promise from 'es6-promise';
// import chai, { expect, should } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import chai, { expect, should } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import createServer from './websocket/rippled.websocket.js';
import { rippleWorkerFactory } from './workers/mock.worker.js';
import { MESSAGES, RESPONSES } from '../src/constants';
import BlockchainLink from '../src';

should();
chai.use(chaiAsPromised);

describe('Ripple call', () => {
    let server;
    let blockchain;

    beforeEach(async () => {
        server = await createServer();
        blockchain = new BlockchainLink({
            name: 'Tests:Ripple',
            worker: rippleWorkerFactory,
            server: [`ws://localhost:${server.options.port}`],
            debug: true,
        });
    });

    afterEach(() => {
        blockchain.dispose();
        server.close();
    });

    it('Get fee', async () => {
        const result = await blockchain.estimateFee();
        expect(result).to.deep.equal([{ name: 'Normal', value: '12' }]);
    });
});
