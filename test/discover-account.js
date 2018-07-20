/* global it:false, describe:false */

import {MockBitcore} from '../src/mock-bitcore';
import {WorkerDiscovery} from '../src/discovery/worker-discovery';
import fixtures from './fixtures/discover-account.json';
import {setPredictable} from '../src/discovery/worker/outside';
setPredictable();

// hack for workers in both node and browser
const discoveryWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        const TinyWorker = require('tiny-worker');

        return new TinyWorker(() => {
            require('babel-register');
            // Terrible hack
            // Browserify throws error if I don't do this
            // Maybe it could be fixed with noParse instead of eval, but I don't know how,
            // since this is all pretty hacky anyway
            // eslint-disable-next-line no-eval
            const requireHack = eval('req' + 'uire');
            requireHack('../../../src/discovery/worker/inside/index.js');
        });
    } else {
        return new Worker('../../src/discovery/worker/inside/index.js');
    }
};

const fastXpubWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        const TinyWorker = require('tiny-worker');
        const worker = new TinyWorker('./fastxpub/build/fastxpub.js');
        const fs = require('fs');
        const filePromise = require('util').promisify(fs.readFile)('./fastxpub/build/fastxpub.wasm')
            // issue with tiny-worker - https://github.com/avoidwork/tiny-worker/issues/18
            .then((buf) => Array.from(buf));
        return {worker, filePromise};
    } else {
        // using this, so Workerify doesn't try to browserify this
        // eslint-disable-next-line no-eval
        const WorkerHack = eval('Work' + 'er');
        // files are served by karma on base/lib/...
        const worker = new WorkerHack('./base/fastxpub/build/fastxpub.js');
        const filePromise = fetch('base/fastxpub/build/fastxpub.wasm')
            .then(response => response.ok ? response.arrayBuffer() : Promise.reject('failed to load'));
        return {worker, filePromise};
    }
};

const {worker: xpubWorker, filePromise: xpubFilePromise} = fastXpubWorkerFactory();

describe('discover account', () => {
    fixtures.forEach(fixture => {
        it(fixture.name, function (done) {
            this.timeout(30 * 1000);

            const blockchain = new MockBitcore(fixture.spec, done);
            const discovery = new WorkerDiscovery(discoveryWorkerFactory, xpubWorker, xpubFilePromise, blockchain);
            const stream = discovery.discoverAccount(
                fixture.start,
                fixture.xpub,
                fixture.network,
                fixture.segwit,
                fixture.cashaddr,
                fixture.gap,
                fixture.timeOffset,
            );
            stream.ending.then((res) => {
                if (!blockchain.errored) {
                    if (JSON.stringify(res) !== JSON.stringify(fixture.end)) {
                        console.log('Discovery result', JSON.stringify(res, null, 2));
                        console.log('Fixture', JSON.stringify(fixture.end, null, 2));
                        done(new Error('Result not the same'));
                    } else {
                        if (blockchain.spec.length > 0) {
                            console.log(JSON.stringify(blockchain.spec));
                            done(new Error('Some spec left on end'));
                        } else {
                            done();
                        }
                    }
                }
            });
        });
    });
});
