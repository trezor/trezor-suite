/* global it:false, describe:false, WebAssembly:true */

import { MockBitcore } from './_mock-bitcore';
import { WorkerDiscovery } from '../src/discovery/worker-discovery';
import fixtures from './fixtures/monitor-account.json';

import { discoveryWorkerFactory, xpubWorker, xpubFilePromise } from './_worker-helper';

const hasWasm = typeof WebAssembly !== 'undefined';
if (hasWasm) {
    monitorAccount(true);
}
monitorAccount(false);

function monitorAccount(enableWebassembly) {
    const desc = enableWebassembly ? ' wasm' : ' no wasm';
    describe(`monitor account${desc}`, () => {
        fixtures.forEach((fixtureOrig) => {
            const fixture = JSON.parse(JSON.stringify(fixtureOrig));
            it(fixture.name, function f(doneOrig) {
                if (typeof jest !== 'undefined') {
                    console.warn(fixture.name);
                    jest.setTimeout(30 * 1000);
                } else {
                    this.timeout(30 * 1000);
                }
                let wasmOld;
                if (!enableWebassembly && hasWasm) {
                    wasmOld = WebAssembly;
                    WebAssembly = undefined;
                }
                const { spec } = fixture;
                const doneWasm = (x) => {
                    if (!enableWebassembly && hasWasm) {
                        WebAssembly = wasmOld;
                    }
                    doneOrig(x);
                };
                const blockchain = new MockBitcore(spec, doneWasm);
                const discovery = new WorkerDiscovery(
                    discoveryWorkerFactory,
                    xpubWorker,
                    xpubFilePromise,
                    blockchain,
                );
                const stream = discovery.monitorAccountActivity(
                    fixture.start,
                    fixture.xpub,
                    fixture.network,
                    fixture.segwit,
                    fixture.cashaddr,
                    fixture.gap,
                    fixture.timeOffset,
                );
                const done = (x) => {
                    stream.dispose();
                    doneWasm(x);
                };

                stream.values.attach((res) => {
                    if (!(res instanceof Error)) {
                        if (!blockchain.errored) {
                            if (JSON.stringify(res) !== JSON.stringify(fixture.end)) {
                                console.log('Discovery result', JSON.stringify(res, null, 2));
                                console.log('Fixture', JSON.stringify(fixture.end, null, 2));
                                done(new Error('Result not the same'));
                            } else if (blockchain.spec.length > 0) {
                                console.log(JSON.stringify(blockchain.spec));
                                done(new Error('Some spec left on end'));
                            } else {
                                done();
                            }
                        }
                    } else {
                        const err = res.message;
                        if (!(err.startsWith(fixture.endError))) {
                            console.log('Discovery result', JSON.stringify(err, null, 2));
                            console.log('Fixture', JSON.stringify(fixture.endError, null, 2));
                            done(new Error('Result not the same'));
                        } else if (blockchain.spec.length > 0) {
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
}
