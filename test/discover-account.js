/* global it:false, describe:false */

import {MockBitcore} from '../src/mock-bitcore';
import {WorkerDiscovery} from '../src/discovery/worker-discovery';
import fixtures from './fixtures/discover-account.json';

import {discoveryWorkerFactory, xpubWorker, xpubFilePromise} from './_worker-helper';

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
            }, (err) => {
                if (err !== fixture.endError) {
                    console.log('Discovery result', JSON.stringify(err, null, 2));
                    console.log('Fixture', JSON.stringify(fixture.endError, null, 2));
                    done(new Error('Result not the same'));
                } else {
                    if (blockchain.spec.length > 0) {
                        console.log(JSON.stringify(blockchain.spec));
                        done(new Error('Some spec left on end'));
                    } else {
                        done();
                    }
                }
            });
        });
    });
});
