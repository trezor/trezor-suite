// require('./test_bitcore/bitcore.js');

/* global it:false, describe:false */

import assert from 'assert';

import {BitcoreBlockchain} from '../src/bitcore';
import {MockWorker} from './_mock-worker.js';
import {Stream} from '../src/utils/stream.js';

describe('bitcore', () => {
    describe('constructor', () => {
        it('creates + destroys something', (done) => {
            const specsA = [
                {
                    type: 'in',
                    spec: {
                        type: 'init',
                        endpoint: 'https://nonsense.com',
                        connectionType: 'websocket',
                    },
                },
                {
                    type: 'out',
                    spec: {
                        type: 'initError',
                    },
                },
            ];
            const specsB = [
                {
                    type: 'in',
                    spec: {
                        type: 'init',
                        endpoint: 'https://nonsense.com',
                        connectionType: 'polling',
                    },
                },
                {
                    type: 'out',
                    spec: {
                        type: 'initError',
                    },
                },
            ];
            const specs = [specsA, specsB];
            const socketWorkerFactory = () => {
                const mspecs = specs.shift();
                const mock = new MockWorker(mspecs, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['https://nonsense.com'], socketWorkerFactory);
            blockchain._silent = true; // not log the error
            assert.ok(blockchain);
            blockchain.destroy().then(() => done());
        });

        it('has correct properties unitialized', (done) => {
            const specsA = [
                {
                    type: 'in',
                    spec: {
                        type: 'init',
                        endpoint: 'https://nonsense.com',
                        connectionType: 'websocket',
                    },
                },
            ];
            const specs = [specsA];
            const socketWorkerFactory = () => {
                const mspecs = specs.shift();
                const mock = new MockWorker(mspecs, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['https://nonsense.com'], socketWorkerFactory);
            assert.ok(blockchain.errors instanceof Stream);
            assert.ok(blockchain.notifications instanceof Stream);
            assert.ok(blockchain.blocks instanceof Stream);

            assert.ok(blockchain.addresses instanceof Set);

            assert.ok(blockchain.socket.promise instanceof Promise);
            assert.ok(blockchain.endpoints instanceof Array);
            assert.ok(blockchain.workingUrl === 'none');
            assert.ok(typeof blockchain.zcash === 'boolean');
            blockchain.destroy().then(() => done());
        });

        it('has correct interface unitialized', (done) => {
            const specsA = [
                {
                    type: 'in',
                    spec: {
                        type: 'init',
                        endpoint: 'https://nonsense.com',
                        connectionType: 'websocket',
                    },
                },
            ];
            const specs = [specsA];
            const socketWorkerFactory = () => {
                const mspecs = specs.shift();
                const mock = new MockWorker(mspecs, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['https://nonsense.com'], socketWorkerFactory);
            assert.ok(blockchain.subscribe(new Set(['abcd'])) == null);
            assert.ok(blockchain.lookupTransactionsStream(['abcd'], 0, 0) instanceof Stream);
            assert.ok(blockchain.lookupTransactions(['abcd'], 0, 0).catch(() => {}) instanceof Promise);
            assert.ok(blockchain.lookupTransaction('abcd').catch(() => {}) instanceof Promise);
            assert.ok(blockchain.lookupBlockHash(1).catch(() => {}) instanceof Promise);
            assert.ok(blockchain.lookupSyncStatus().catch(() => {}) instanceof Promise);
            assert.ok(blockchain.sendTransaction('abcd').catch(() => {}) instanceof Promise);
            blockchain.destroy().then(() => done());
        });

        it('has rejecting socket and null workingUrl on non-working bitcore', function (done) {
            const specsA = [
                {
                    type: 'in',
                    spec: {
                        type: 'init',
                        endpoint: 'https://nonsense.com',
                        connectionType: 'websocket',
                    },
                },
                {
                    type: 'out',
                    spec: {
                        type: 'initError',
                    },
                },
            ];
            const specsB = [
                {
                    type: 'in',
                    spec: {
                        type: 'init',
                        endpoint: 'https://nonsense.com',
                        connectionType: 'polling',
                    },
                },
                {
                    type: 'out',
                    spec: {
                        type: 'initError',
                    },
                },
            ];
            const specs = [specsA, specsB];
            const socketWorkerFactory = () => {
                const mspecs = specs.shift();
                const mock = new MockWorker(mspecs, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['https://nonsense.com'], socketWorkerFactory);
            blockchain._silent = true; // not log the error
            assert.ok(blockchain);
            blockchain.socket.promise.then(() => {
                blockchain.destroy().then(() => {
                    done(new Error('blockchain.socket should not resolve'));
                });
            }, (err) => {
                assert.deepStrictEqual(err.message, 'All backends are offline.');
                assert.deepStrictEqual(blockchain.workingUrl, 'none');
                blockchain.destroy().then(() => done());
            });
        });
        it('emits error on non-working bitcore', function (done) {
            const specsA = [
                {
                    type: 'in',
                    spec: {
                        type: 'init',
                        endpoint: 'https://nonsense.com',
                        connectionType: 'websocket',
                    },
                },
                {
                    type: 'out',
                    spec: {
                        type: 'initError',
                    },
                },
            ];
            const specsB = [
                {
                    type: 'in',
                    spec: {
                        type: 'init',
                        endpoint: 'https://nonsense.com',
                        connectionType: 'polling',
                    },
                },
                {
                    type: 'out',
                    spec: {
                        type: 'initError',
                    },
                },
            ];
            const specs = [specsA, specsB];
            const socketWorkerFactory = () => {
                const mspecs = specs.shift();
                const mock = new MockWorker(mspecs, done, true);
                return mock;
            };
            let error = null;
            const blockchain = new BitcoreBlockchain(['https://nonsense.com'], socketWorkerFactory);
            blockchain._silent = true; // not log the error
            blockchain.errors.values.attach(v => { error = v; });
            setTimeout(() => {
                assert.deepStrictEqual(error.message, 'All backends are offline.');
                blockchain.destroy().then(() => done());
            }, 50);
        });
    });
});

