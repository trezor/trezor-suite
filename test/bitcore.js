// require('./test_bitcore/bitcore.js');

/* global it:false, describe:false */

import assert from 'assert';

import { BitcoreBlockchain } from '../src/bitcore';
import { MockWorker } from './_mock-worker.js';
import { Stream } from '../src/utils/stream.js';
import { Socket } from '../src/socketio-worker/outside';

// this is here because the starting communication is always the same

const commStart = [{
    type: 'in',
    spec: {
        type: 'init',
        endpoint: 'http://localhost:3005',
        connectionType: 'websocket',
    },
}, {
    type: 'out',
    spec: {
        type: 'initDone',
    },
}, {
    type: 'in',
    spec: {
        type: 'observe',
        event: 'connect_error',
        id: 1,
    },
},
{
    type: 'in',
    spec: {
        type: 'observe',
        event: 'reconnect_error',
        id: 2,
    },
},
{
    type: 'in',
    spec: {
        type: 'observe',
        event: 'close',
        id: 3,
    },
},
{
    type: 'in',
    spec: {
        type: 'observe',
        event: 'disconnect',
        id: 4,
    },
},
{
    type: 'in',
    spec: {
        type: 'observe',
        event: 'error',
        id: 5,
    },
},
{
    type: 'in',
    spec: {
        type: 'send',
        message: {
            method: 'getBlockHeader',
            params: [
                0,
            ],
        },
        id: 6,
    },
},
{
    type: 'out',
    spec: {
        type: 'sendReply',
        reply: {
            result: {
                hash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
                version: 1,
                confirmations: 1,
                height: 0,
                chainWork: '0000000000000000000000000000000000000000000000000000000000000002',
                merkleRoot: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
                time: 1296688602,
                medianTime: 1296688602,
                nonce: 2,
                bits: '207fffff',
                difficulty: 4.656542373906925e-10,
            },
        },
        id: 6,
    },
},
{
    type: 'in',
    spec: {
        type: 'send',
        message: {
            method: 'estimateSmartFee',
            params: [
                2,
                false,
            ],
        },
        id: 7,
    },
},
{ // the mocked one has only dumb fees
    type: 'out',
    spec: {
        type: 'sendReply',
        reply: {
            error: {
                message: 'Method Not Found',
            },
        },
        id: 7,
    },
},
{
    type: 'in',
    spec: {
        type: 'observe',
        event: 'bitcoind/addresstxid',
        id: 8,
    },
},
{
    type: 'in',
    spec: {
        type: 'subscribe',
        event: 'bitcoind/hashblock',
        values: [],
    },
},
{
    type: 'in',
    spec: {
        type: 'observe',
        event: 'bitcoind/hashblock',
        id: 9,
    },
}];

// the IDs are the same as at the start
const commEnd = [{
    type: 'in',
    spec: {
        type: 'unobserve',
        event: 'connect_error',
        id: 1,
    },
},
{
    type: 'in',
    spec: {
        type: 'unobserve',
        event: 'reconnect_error',
        id: 2,
    },
},
{
    type: 'in',
    spec: {
        type: 'unobserve',
        event: 'error',
        id: 5,
    },
},
{
    type: 'in',
    spec: {
        type: 'unobserve',
        event: 'close',
        id: 3,
    },
},
{
    type: 'in',
    spec: {
        type: 'unobserve',
        event: 'disconnect',
        id: 4,
    },
}, {
    type: 'in',
    spec: {
        type: 'unobserve',
        event: 'bitcoind/addresstxid',
        id: 8,
    },
}, {
    type: 'in',
    spec: {
        type: 'unobserve',
        event: 'bitcoind/hashblock',
        id: 9,
    },
}, {
    type: 'in',
    spec: {
        type: 'close',
    },
}, {
    type: 'out',
    spec: {
        type: 'emit',
        event: 'disconnect',
        data: 'io client disconnect',
    },
}];

describe('bitcore', () => {
    describe('constructor', () => {
        // first non-working URLs
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

        it('has rejecting socket and null workingUrl on non-working bitcore', (done) => {
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

        it('emits error on non-working bitcore', (done) => {
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
            blockchain.errors.values.attach((v) => { error = v; });
            setTimeout(() => {
                assert.deepStrictEqual(error.message, 'All backends are offline.');
                blockchain.destroy().then(() => done());
            }, 50);
        });

        it('interprets hanging on getBlock for 30s as non-working', function (done) {
            this.timeout(60 * 1000);
            console.info('(note - this test takes 50s)');
            const specsA = [{
                type: 'in',
                spec: {
                    type: 'init',
                    endpoint: 'https://nonsense.com',
                    connectionType: 'websocket',
                },
            }, {
                type: 'out',
                spec: {
                    type: 'initDone',
                },
            }, {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'connect_error',
                    id: 1,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'reconnect_error',
                    id: 2,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'close',
                    id: 3,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'disconnect',
                    id: 4,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'error',
                    id: 5,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getBlockHeader',
                        params: [
                            0,
                        ],
                    },
                    id: 6,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'unobserve',
                    event: 'connect_error',
                    id: 1,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'unobserve',
                    event: 'reconnect_error',
                    id: 2,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'unobserve',
                    event: 'error',
                    id: 5,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'unobserve',
                    event: 'close',
                    id: 3,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'unobserve',
                    event: 'disconnect',
                    id: 4,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'close',
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
            blockchain.errors.values.attach((v) => { error = v; });
            setTimeout(() => {
                assert.deepStrictEqual(error.message, 'All backends are offline.');
                blockchain.destroy().then(() => done());
            }, 50 * 1000);
        });

        it('interprets immediately closing as non-working', (done) => {
            const specsA = [{
                type: 'in',
                spec: {
                    type: 'init',
                    endpoint: 'https://nonsense.com',
                    connectionType: 'websocket',
                },
            }, {
                type: 'out',
                spec: {
                    type: 'initDone',
                },
            }, {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'connect_error',
                    id: 1,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'reconnect_error',
                    id: 2,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'close',
                    id: 3,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'disconnect',
                    id: 4,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'error',
                    id: 5,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getBlockHeader',
                        params: [
                            0,
                        ],
                    },
                    id: 6,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'emit',
                    event: 'disconnect',
                    data: 'io client disconnect',
                },
            }, {
                type: 'in',
                spec: {
                    type: 'close',
                },
            }];
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
            blockchain.errors.values.attach((v) => { error = v; });
            setTimeout(() => {
                assert.deepStrictEqual(error.message, 'All backends are offline.');
                blockchain.destroy().then(() => done());
            }, 500);
        });

        // and now working bitcore
        it('has socket and workingUrl as expected when working', (done) => {
            const spec = commStart.concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };

            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            setTimeout(() => {
                blockchain.socket.promise.then((socket) => {
                    assert.ok(socket instanceof Socket);
                    assert.ok(blockchain.workingUrl === 'http://localhost:3005');
                    blockchain.destroy().then(() => done());
                }, () => {
                    blockchain.destroy().then(() => done(new Error('blockchain.socket rejected')));
                });
            }, 100);
        });

        it('does not emmit error when working', (done) => {
            const spec = commStart.concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };

            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            let seenError = false;
            blockchain.errors.values.attach(() => { seenError = true; });

            setTimeout(() => {
                assert.deepStrictEqual(seenError, false);
                blockchain.destroy().then(() => done());
            }, 100);
        });
    });

    describe('hard status check', () => {
        it('is true when working', (done) => {
            const spec = commStart.concat(commEnd);
            const socketWorkerFactory = () => {
                // all have the same spec
                // hardstatuscheck just creates another instance
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            blockchain.hardStatusCheck().then((res) => {
                assert.deepStrictEqual(res, true);
                blockchain.destroy().then(() => done());
            });
        });

        it('is false when not working', (done) => {
            const specG = commStart.concat(commEnd);
            const specsA = [
                {
                    type: 'in',
                    spec: {
                        type: 'init',
                        endpoint: 'http://localhost:3005',
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
                        endpoint: 'http://localhost:3005',
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
            const specs = [specG, specsA, specsB];
            // first working, then the status check broken
            const socketWorkerFactory = () => {
                const mspecs = specs.shift();
                const mock = new MockWorker(mspecs, done, true);
                return mock;
            };

            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            blockchain.hardStatusCheck().then((res) => {
                assert.deepStrictEqual(res, false);
                blockchain.destroy().then(() => done());
            });
        });
    });

    describe('subscribe', () => {
        // note - bitcore.js doesn't know about versions bytes, it doesn't check address validity
        it('throws on wrong input', (done) => {
            const spec = commStart.concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            for (const inputs of [['foo'], 'foo', [123], new Set([123])]) {
                try {
                    blockchain.subscribe(inputs);
                    assert(false);
                } catch (e) {
                    assert(true);
                }
            }

            blockchain.destroy().then(() => done());
        });

        it('does nothing on empty input', (done) => {
            const spec = commStart.concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            try {
                blockchain.subscribe(new Set([]));
                assert(true);
            } catch (e) {
                assert(false);
            }

            blockchain.destroy().then(() => done());
        });

        it('does nothing on non-working bitcore', (done) => {
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
            try {
                blockchain.subscribe(new Set([]));
                assert(true);
            } catch (e) {
                assert(false);
            }

            blockchain.destroy().then(() => done());
        });

        it('subscribes to thing', (done) => {
            const commMiddle = [{
                type: 'in',
                spec: {
                    type: 'subscribe',
                    event: 'bitcoind/addresstxid',
                    values: [
                        [
                            'mgyM5P4AVffXLPZ8H9Kz4Y3pJYFk5U9Qdr',
                        ],
                    ],
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'emit',
                    event: 'bitcoind/addresstxid',
                    data: {
                        address: 'mgyM5P4AVffXLPZ8H9Kz4Y3pJYFk5U9Qdr',
                        txid: '81b312b2c70bb1bc54454671f06dc081b8e7526278adaca2ce07e1abac14a592',
                    },
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getDetailedTransaction',
                        params: [
                            '81b312b2c70bb1bc54454671f06dc081b8e7526278adaca2ce07e1abac14a592',
                        ],
                    },
                    id: 10,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: {
                            hex: '02000000010000000000000000000000000000000000000000000000000000000000000000ffffffff05022e010101ffffffff02808b814a000000001976a9140ff5f5345000a17d667d893d5a2322404716d8f188ac0000000000000000266a24aa21a9ed91b9461f86a372d90bb7e93175c907308476361e3781341e8749292300182b8200000000',
                            blockHash: '4830edbdd234256a77c5e90ad6cfda52bc37bee7fcb7b98bf4364c60ca2223b9',
                            height: 302,
                            blockTimestamp: 1544936347,
                            version: 2,
                            hash: '81b312b2c70bb1bc54454671f06dc081b8e7526278adaca2ce07e1abac14a592',
                            locktime: 0,
                            size: 137,
                            coinbase: true,
                            inputs: [
                                {
                                    prevTxId: null,
                                    outputIndex: null,
                                    script: '022e010101',
                                    scriptAsm: null,
                                    sequence: 4294967295,
                                    address: null,
                                    satoshis: null,
                                },
                            ],
                            inputSatoshis: 0,
                            outputs: [
                                {
                                    satoshis: 1250003840,
                                    script: '76a9140ff5f5345000a17d667d893d5a2322404716d8f188ac',
                                    scriptAsm: 'OP_DUP OP_HASH160 0ff5f5345000a17d667d893d5a2322404716d8f1 OP_EQUALVERIFY OP_CHECKSIG',
                                    address: 'mgyM5P4AVffXLPZ8H9Kz4Y3pJYFk5U9Qdr',
                                },
                                {
                                    satoshis: 0,
                                    script: '6a24aa21a9ed91b9461f86a372d90bb7e93175c907308476361e3781341e8749292300182b82',
                                    scriptAsm: 'OP_RETURN aa21a9ed91b9461f86a372d90bb7e93175c907308476361e3781341e8749292300182b82',
                                    address: null,
                                },
                            ],
                            outputSatoshis: 1250003840,
                            feeSatoshis: 0,
                        },
                    },
                    id: 10,
                },
            }];
            const corrTx = {
                zcash: false,
                hex: '02000000010000000000000000000000000000000000000000000000000000000000000000ffffffff05022e010101ffffffff02808b814a000000001976a9140ff5f5345000a17d667d893d5a2322404716d8f188ac0000000000000000266a24aa21a9ed91b9461f86a372d90bb7e93175c907308476361e3781341e8749292300182b8200000000',
                height: 302,
                timestamp: 1544936347,
                hash: '81b312b2c70bb1bc54454671f06dc081b8e7526278adaca2ce07e1abac14a592',
                inputAddresses: [null],
                outputAddresses: ['mgyM5P4AVffXLPZ8H9Kz4Y3pJYFk5U9Qdr', null],
                vsize: 137,
            };

            const spec = commStart.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);

            blockchain.subscribe(new Set(['mgyM5P4AVffXLPZ8H9Kz4Y3pJYFk5U9Qdr']));
            blockchain.notifications.values.attach((tx) => {
                assert.deepStrictEqual(tx, corrTx);
                blockchain.destroy().then(() => done());
            });
        });
    });

    describe('lookupTransactionsStream', () => {
        it('looks up transactions', (done) => {
            const commMiddle = [{
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getAddressHistory',
                        params: [
                            [
                                'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                            ],
                            {
                                start: 10000000,
                                end: 0,
                                queryMempoolOnly: true,
                                from: 0,
                                to: 1,
                            },
                        ],
                    },
                    id: 10,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getAddressHistory',
                        params: [
                            [
                                'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                            ],
                            {
                                start: 10000000,
                                end: 0,
                                queryMempol: false,
                                from: 0,
                                to: 1,
                            },
                        ],
                    },
                    id: 11,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: {
                            totalCount: 0,
                            items: [],
                        },
                    },
                    id: 11,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: {
                            totalCount: 6,
                            items: [
                                {
                                    addresses: {
                                        n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                1,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '02000000014d003ae3f324fddcf78a8d76bb35e8c0cb1a0f6fa57041c5fdc0ba3b4c67e5ad0000000048473044022020ba68b5ff34cf93796a844593a70d2eeca7bc34c012fc03305203df5b87f7bf0220565dd3b76b0a8588a6c4581bb0b36d203edadcd976717da99c9941de52fbdc5301feffffff0240ce4a1f000000001976a9140881a6bae1125d60a614ec2965225687a076ca3a88ac00e1f505000000001976a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: 'ee9a9b333e6e7ba39b58234c990a3fe71890f93f9894b1f872fc4bf972d58b1b',
                                        locktime: 902,
                                        size: 191,
                                        inputs: [
                                            {
                                                prevTxId: 'ade5674c3bbac0fdc54170a56f0f1acbc0e835bb768d8af7dcfd24f3e33a004d',
                                                outputIndex: 0,
                                                script: '473044022020ba68b5ff34cf93796a844593a70d2eeca7bc34c012fc03305203df5b87f7bf0220565dd3b76b0a8588a6c4581bb0b36d203edadcd976717da99c9941de52fbdc5301',
                                                scriptAsm: '3044022020ba68b5ff34cf93796a844593a70d2eeca7bc34c012fc03305203df5b87f7bf0220565dd3b76b0a8588a6c4581bb0b36d203edadcd976717da99c9941de52fbdc53[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 524996160,
                                                script: '76a9140881a6bae1125d60a614ec2965225687a076ca3a88ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 0881a6bae1125d60a614ec2965225687a076ca3a OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mgHw1vCvZidX8n4gPa4VqMnGjLXHNqjtj2',
                                            },
                                            {
                                                satoshis: 100000000,
                                                script: '76a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 ec23ffdc34aa576b8227f76f1b16d3782025e9e4 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                            ],
                        },
                    },
                    id: 10,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getAddressHistory',
                        params: [
                            [
                                'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                            ],
                            {
                                start: 10000000,
                                end: 0,
                                queryMempoolOnly: true,
                                from: 1,
                                to: 6,
                            },
                        ],
                    },
                    id: 12,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: {
                            totalCount: 6,
                            items: [
                                {
                                    addresses: {
                                        mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                0,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '020000000161b33cc9ce724ce662c38733a598d69f6af07ba49514d9e33c9b6a13a7da0a7f000000004847304402204dc0783fd47e26b9dee5cd352c7136c6f6200e203cfa4951afc051b2f8749250022045bf8a71a5a2a167288f6a698c57e98e11867454ea5906220fdc9e7059b24fe801feffffff0200e1f505000000001976a9143732c8fb478ca48165d686f70125e0ed223f364188ac40ce4a1f000000001976a9140a51f5d9832ef732150f81807c2d7a9982c179d788ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: 'e0b48392659feb13325c6222cb30c5f10db4cdff673177ab6455c618356aa933',
                                        locktime: 902,
                                        size: 191,
                                        inputs: [
                                            {
                                                prevTxId: '7f0adaa7136a9b3ce3d91495a47bf06a9fd698a53387c362e64c72cec93cb361',
                                                outputIndex: 0,
                                                script: '47304402204dc0783fd47e26b9dee5cd352c7136c6f6200e203cfa4951afc051b2f8749250022045bf8a71a5a2a167288f6a698c57e98e11867454ea5906220fdc9e7059b24fe801',
                                                scriptAsm: '304402204dc0783fd47e26b9dee5cd352c7136c6f6200e203cfa4951afc051b2f8749250022045bf8a71a5a2a167288f6a698c57e98e11867454ea5906220fdc9e7059b24fe8[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 100000000,
                                                script: '76a9143732c8fb478ca48165d686f70125e0ed223f364188ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 3732c8fb478ca48165d686f70125e0ed223f3641 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                            },
                                            {
                                                satoshis: 524996160,
                                                script: '76a9140a51f5d9832ef732150f81807c2d7a9982c179d788ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 0a51f5d9832ef732150f81807c2d7a9982c179d7 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mgTXEgEfpGtuC6imnZU8hCBssafBEz3xgi',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                                {
                                    addresses: {
                                        mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                1,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '02000000016e9d3d44b7c371e3221c45d42f79e0a8e764d4e748cad88562700267433f221f00000000494830450221008d592c419aafdb8f677025db7f38ae546d8c16943fea9869286201782f993a12022023a1bdb03f99db9eb0062a33b879933538cc44875669645b1e4a617036c09e0701feffffff0240ce4a1f000000001976a9144b7345dac0bd0d956ff72370c6749103969ad5f988ac00e1f505000000001976a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: 'fddec931105b2555b6d0c6e03c654fce064e4d2212e1fec2219d4c97bfff8923',
                                        locktime: 902,
                                        size: 192,
                                        inputs: [
                                            {
                                                prevTxId: '1f223f436702706285d8ca48e7d464e7a8e0792fd4451c22e371c3b7443d9d6e',
                                                outputIndex: 0,
                                                script: '4830450221008d592c419aafdb8f677025db7f38ae546d8c16943fea9869286201782f993a12022023a1bdb03f99db9eb0062a33b879933538cc44875669645b1e4a617036c09e0701',
                                                scriptAsm: '30450221008d592c419aafdb8f677025db7f38ae546d8c16943fea9869286201782f993a12022023a1bdb03f99db9eb0062a33b879933538cc44875669645b1e4a617036c09e07[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 524996160,
                                                script: '76a9144b7345dac0bd0d956ff72370c6749103969ad5f988ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 4b7345dac0bd0d956ff72370c6749103969ad5f9 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mnPu4jur3yL2mozJiM1ZWJoYLdWoutxykF',
                                            },
                                            {
                                                satoshis: 100000000,
                                                script: '76a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 9187090295b4901cd9e902fdd7d5bff7fd6dd870 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                                {
                                    addresses: {
                                        n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                0,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '0200000001088d3695724f9974dba7018bc26c6fd7056f04f4a7238aebc3a03a6b86cf47ca0000000049483045022100d813498e9c27c24284ba05ec1eae784692ee25257bd7056e81d5b8bafd66d51302204999038cc2c31c55a7a336a763f4a4c4cb410c2c1e8b34c1d520f5522f75afd301feffffff0200e1f505000000001976a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac40ce4a1f000000001976a9146ce2fcfa2aee4544db61dbad0f09e62431ca646b88ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: '7767846399872f3d84e5a030651608ba2c373feb0cf61fe44fbcac9b4b2012cc',
                                        locktime: 902,
                                        size: 192,
                                        inputs: [
                                            {
                                                prevTxId: 'ca47cf866b3aa0c3eb8a23a7f4046f05d76f6cc28b01a7db74994f7295368d08',
                                                outputIndex: 0,
                                                script: '483045022100d813498e9c27c24284ba05ec1eae784692ee25257bd7056e81d5b8bafd66d51302204999038cc2c31c55a7a336a763f4a4c4cb410c2c1e8b34c1d520f5522f75afd301',
                                                scriptAsm: '3045022100d813498e9c27c24284ba05ec1eae784692ee25257bd7056e81d5b8bafd66d51302204999038cc2c31c55a7a336a763f4a4c4cb410c2c1e8b34c1d520f5522f75afd3[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 100000000,
                                                script: '76a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 ec23ffdc34aa576b8227f76f1b16d3782025e9e4 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                            },
                                            {
                                                satoshis: 524996160,
                                                script: '76a9146ce2fcfa2aee4544db61dbad0f09e62431ca646b88ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 6ce2fcfa2aee4544db61dbad0f09e62431ca646b OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mqShCBqzsipjYCHA5jzcwrgHuLBgTqsfvk',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                                {
                                    addresses: {
                                        mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                1,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '020000000175d7a86f03d955f9b2d73f7daa92d4eb47c9282e6cdbdf00911bd6d1654c71f70000000049483045022100fc860eeb12809fe38ced2db5a9c866752ae75b2d8bd81f42e08e47345b3a374102205dced01525c6174f482e42fcd85de6419fb88dc84ecb388d04fd42bd4816576401feffffff0240ce4a1f000000001976a9145044bd4f4267eb5450402996dc305404e178112888ac00e1f505000000001976a9143732c8fb478ca48165d686f70125e0ed223f364188ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: '6e53a9727b2e28923c6348cfd55b73dccf3a342664394fc40a8fad48982b2c76',
                                        locktime: 902,
                                        size: 192,
                                        inputs: [
                                            {
                                                prevTxId: 'f7714c65d1d61b9100dfdb6c2e28c947ebd492aa7d3fd7b2f955d9036fa8d775',
                                                outputIndex: 0,
                                                script: '483045022100fc860eeb12809fe38ced2db5a9c866752ae75b2d8bd81f42e08e47345b3a374102205dced01525c6174f482e42fcd85de6419fb88dc84ecb388d04fd42bd4816576401',
                                                scriptAsm: '3045022100fc860eeb12809fe38ced2db5a9c866752ae75b2d8bd81f42e08e47345b3a374102205dced01525c6174f482e42fcd85de6419fb88dc84ecb388d04fd42bd48165764[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 524996160,
                                                script: '76a9145044bd4f4267eb5450402996dc305404e178112888ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 5044bd4f4267eb5450402996dc305404e1781128 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mnqNhWBhJJBj7YBrJsFsXUtwFk3jWzZDgB',
                                            },
                                            {
                                                satoshis: 100000000,
                                                script: '76a9143732c8fb478ca48165d686f70125e0ed223f364188ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 3732c8fb478ca48165d686f70125e0ed223f3641 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                                {
                                    addresses: {
                                        mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                0,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '02000000017f971cfdf41412a4d6fb8e4fdee05145b88ddab326c9ab97a97b596aabfa97f20000000049483045022100c6de99ddcb0944f61dfcad07cdb2981ee7ee2a9eef88f8e646214df3fb7f1b2a022007e4fded62f5e0407417fc0580e473b56000eb5d1f0d001ac38af330ae061ded01feffffff0200e1f505000000001976a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac40ce4a1f000000001976a914893893f15e73899afe8beff1947b07cebe2c4bbe88ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: '1bc5d5f51d99381330eb73c6e9877c9eb17fe32399230c361fceb85510c7abac',
                                        locktime: 902,
                                        // commented out to test
                                        // size: 192,
                                        inputs: [
                                            {
                                                prevTxId: 'f297faab6a597ba997abc926b3da8db84551e0de4f8efbd6a41214f4fd1c977f',
                                                outputIndex: 0,
                                                script: '483045022100c6de99ddcb0944f61dfcad07cdb2981ee7ee2a9eef88f8e646214df3fb7f1b2a022007e4fded62f5e0407417fc0580e473b56000eb5d1f0d001ac38af330ae061ded01',
                                                scriptAsm: '3045022100c6de99ddcb0944f61dfcad07cdb2981ee7ee2a9eef88f8e646214df3fb7f1b2a022007e4fded62f5e0407417fc0580e473b56000eb5d1f0d001ac38af330ae061ded[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 100000000,
                                                script: '76a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 9187090295b4901cd9e902fdd7d5bff7fd6dd870 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                                            },
                                            {
                                                satoshis: 524996160,
                                                script: '76a914893893f15e73899afe8beff1947b07cebe2c4bbe88ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 893893f15e73899afe8beff1947b07cebe2c4bbe OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mt2WeSG2hFURbq9BsPX4ahLTBt8s5Urccd',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                            ],
                        },
                    },
                    id: 12,
                },
            }];
            const spec = commStart.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.lookupTransactionsStream(['mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa', 'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH', 'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv'], 10000000, 0);
            const corrTxs = [
                [],
                [
                    {
                        zcash: false,
                        hex: '02000000014d003ae3f324fddcf78a8d76bb35e8c0cb1a0f6fa57041c5fdc0ba3b4c67e5ad0000000048473044022020ba68b5ff34cf93796a844593a70d2eeca7bc34c012fc03305203df5b87f7bf0220565dd3b76b0a8588a6c4581bb0b36d203edadcd976717da99c9941de52fbdc5301feffffff0240ce4a1f000000001976a9140881a6bae1125d60a614ec2965225687a076ca3a88ac00e1f505000000001976a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac86030000',
                        height: null,
                        timestamp: null,
                        hash: 'ee9a9b333e6e7ba39b58234c990a3fe71890f93f9894b1f872fc4bf972d58b1b',
                        inputAddresses: [
                            null,
                        ],
                        outputAddresses: [
                            'mgHw1vCvZidX8n4gPa4VqMnGjLXHNqjtj2',
                            'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                        ],
                        vsize: 191,
                    },
                ],
                [
                    {
                        zcash: false,
                        hex: '020000000161b33cc9ce724ce662c38733a598d69f6af07ba49514d9e33c9b6a13a7da0a7f000000004847304402204dc0783fd47e26b9dee5cd352c7136c6f6200e203cfa4951afc051b2f8749250022045bf8a71a5a2a167288f6a698c57e98e11867454ea5906220fdc9e7059b24fe801feffffff0200e1f505000000001976a9143732c8fb478ca48165d686f70125e0ed223f364188ac40ce4a1f000000001976a9140a51f5d9832ef732150f81807c2d7a9982c179d788ac86030000',
                        height: null,
                        timestamp: null,
                        hash: 'e0b48392659feb13325c6222cb30c5f10db4cdff673177ab6455c618356aa933',
                        inputAddresses: [
                            null,
                        ],
                        outputAddresses: [
                            'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                            'mgTXEgEfpGtuC6imnZU8hCBssafBEz3xgi',
                        ],
                        vsize: 191,
                    },
                    {
                        zcash: false,
                        hex: '02000000016e9d3d44b7c371e3221c45d42f79e0a8e764d4e748cad88562700267433f221f00000000494830450221008d592c419aafdb8f677025db7f38ae546d8c16943fea9869286201782f993a12022023a1bdb03f99db9eb0062a33b879933538cc44875669645b1e4a617036c09e0701feffffff0240ce4a1f000000001976a9144b7345dac0bd0d956ff72370c6749103969ad5f988ac00e1f505000000001976a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac86030000',
                        height: null,
                        timestamp: null,
                        hash: 'fddec931105b2555b6d0c6e03c654fce064e4d2212e1fec2219d4c97bfff8923',
                        inputAddresses: [
                            null,
                        ],
                        outputAddresses: [
                            'mnPu4jur3yL2mozJiM1ZWJoYLdWoutxykF',
                            'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                        ],
                        vsize: 192,
                    },
                    {
                        zcash: false,
                        hex: '0200000001088d3695724f9974dba7018bc26c6fd7056f04f4a7238aebc3a03a6b86cf47ca0000000049483045022100d813498e9c27c24284ba05ec1eae784692ee25257bd7056e81d5b8bafd66d51302204999038cc2c31c55a7a336a763f4a4c4cb410c2c1e8b34c1d520f5522f75afd301feffffff0200e1f505000000001976a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac40ce4a1f000000001976a9146ce2fcfa2aee4544db61dbad0f09e62431ca646b88ac86030000',
                        height: null,
                        timestamp: null,
                        hash: '7767846399872f3d84e5a030651608ba2c373feb0cf61fe44fbcac9b4b2012cc',
                        inputAddresses: [
                            null,
                        ],
                        outputAddresses: [
                            'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                            'mqShCBqzsipjYCHA5jzcwrgHuLBgTqsfvk',
                        ],
                        vsize: 192,
                    },
                    {
                        zcash: false,
                        hex: '020000000175d7a86f03d955f9b2d73f7daa92d4eb47c9282e6cdbdf00911bd6d1654c71f70000000049483045022100fc860eeb12809fe38ced2db5a9c866752ae75b2d8bd81f42e08e47345b3a374102205dced01525c6174f482e42fcd85de6419fb88dc84ecb388d04fd42bd4816576401feffffff0240ce4a1f000000001976a9145044bd4f4267eb5450402996dc305404e178112888ac00e1f505000000001976a9143732c8fb478ca48165d686f70125e0ed223f364188ac86030000',
                        height: null,
                        timestamp: null,
                        hash: '6e53a9727b2e28923c6348cfd55b73dccf3a342664394fc40a8fad48982b2c76',
                        inputAddresses: [
                            null,
                        ],
                        outputAddresses: [
                            'mnqNhWBhJJBj7YBrJsFsXUtwFk3jWzZDgB',
                            'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                        ],
                        vsize: 192,
                    },
                    {
                        zcash: false,
                        hex: '02000000017f971cfdf41412a4d6fb8e4fdee05145b88ddab326c9ab97a97b596aabfa97f20000000049483045022100c6de99ddcb0944f61dfcad07cdb2981ee7ee2a9eef88f8e646214df3fb7f1b2a022007e4fded62f5e0407417fc0580e473b56000eb5d1f0d001ac38af330ae061ded01feffffff0200e1f505000000001976a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac40ce4a1f000000001976a914893893f15e73899afe8beff1947b07cebe2c4bbe88ac86030000',
                        height: null,
                        timestamp: null,
                        hash: '1bc5d5f51d99381330eb73c6e9877c9eb17fe32399230c361fceb85510c7abac',
                        inputAddresses: [
                            null,
                        ],
                        outputAddresses: [
                            'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                            'mt2WeSG2hFURbq9BsPX4ahLTBt8s5Urccd',
                        ],
                        vsize: 192,
                    },
                ],
            ];
            const txs = [];
            s.values.attach(t => txs.push(t));
            let finished = false;
            s.finish.attach(() => {
                // assert.deepStrictEqual(txs[0], corrTxs[0]);
                // assert.deepStrictEqual(txs[1][1], corrTxs[1][1]);
                // assert.deepStrictEqual(1,2);
                // assert.deepStrictEqual(txs[2][1], corrTxs[2][1]);
                finished = true;
            });
            setTimeout(() => {
                assert.deepStrictEqual(txs, corrTxs);
                assert.deepStrictEqual(finished, true);
                blockchain.destroy().then(() => done());
            }, 300);
        });

        it('streams error when error returned', (done) => {
            const commMiddle = [{
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getAddressHistory',
                        params: [
                            [
                                'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                            ],
                            {
                                start: 10000000,
                                end: 0,
                                queryMempoolOnly: true,
                                from: 0,
                                to: 1,
                            },
                        ],
                    },
                    id: 10,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getAddressHistory',
                        params: [
                            [
                                'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                            ],
                            {
                                start: 10000000,
                                end: 0,
                                queryMempol: false,
                                from: 0,
                                to: 1,
                            },
                        ],
                    },
                    id: 11,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        error: {
                            message: 'Some error',
                        },
                    },
                    id: 11,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        error: {
                            message: 'Some error',
                        },
                    },
                    id: 10,
                },
            },
            ];
            const spec = commStart.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.lookupTransactionsStream(['mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa', 'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH', 'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv'], 10000000, 0);
            const errs = [];
            s.values.attach(e => errs.push(e));
            let finished = false;
            s.finish.attach(() => {
                finished = true;
            });
            setTimeout(() => {
                assert.deepStrictEqual(errs[0] instanceof Error, true);
                assert.deepStrictEqual(errs[0].message, 'Some error');
                assert.deepStrictEqual(errs[1].message, 'Some error');
                assert.deepStrictEqual(finished, true);
                blockchain.destroy().then(() => done());
            }, 300);
        });
    });

    describe('lookupTransactions', () => {
        it('looks up transactions', (done) => {
            const commMiddle = [{
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getAddressHistory',
                        params: [
                            [
                                'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                            ],
                            {
                                start: 10000000,
                                end: 0,
                                queryMempoolOnly: true,
                                from: 0,
                                to: 1,
                            },
                        ],
                    },
                    id: 10,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getAddressHistory',
                        params: [
                            [
                                'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                            ],
                            {
                                start: 10000000,
                                end: 0,
                                queryMempol: false,
                                from: 0,
                                to: 1,
                            },
                        ],
                    },
                    id: 11,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: {
                            totalCount: 0,
                            items: [],
                        },
                    },
                    id: 11,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: {
                            totalCount: 6,
                            items: [
                                {
                                    addresses: {
                                        n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                1,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '02000000014d003ae3f324fddcf78a8d76bb35e8c0cb1a0f6fa57041c5fdc0ba3b4c67e5ad0000000048473044022020ba68b5ff34cf93796a844593a70d2eeca7bc34c012fc03305203df5b87f7bf0220565dd3b76b0a8588a6c4581bb0b36d203edadcd976717da99c9941de52fbdc5301feffffff0240ce4a1f000000001976a9140881a6bae1125d60a614ec2965225687a076ca3a88ac00e1f505000000001976a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: 'ee9a9b333e6e7ba39b58234c990a3fe71890f93f9894b1f872fc4bf972d58b1b',
                                        locktime: 902,
                                        size: 191,
                                        inputs: [
                                            {
                                                prevTxId: 'ade5674c3bbac0fdc54170a56f0f1acbc0e835bb768d8af7dcfd24f3e33a004d',
                                                outputIndex: 0,
                                                script: '473044022020ba68b5ff34cf93796a844593a70d2eeca7bc34c012fc03305203df5b87f7bf0220565dd3b76b0a8588a6c4581bb0b36d203edadcd976717da99c9941de52fbdc5301',
                                                scriptAsm: '3044022020ba68b5ff34cf93796a844593a70d2eeca7bc34c012fc03305203df5b87f7bf0220565dd3b76b0a8588a6c4581bb0b36d203edadcd976717da99c9941de52fbdc53[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 524996160,
                                                script: '76a9140881a6bae1125d60a614ec2965225687a076ca3a88ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 0881a6bae1125d60a614ec2965225687a076ca3a OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mgHw1vCvZidX8n4gPa4VqMnGjLXHNqjtj2',
                                            },
                                            {
                                                satoshis: 100000000,
                                                script: '76a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 ec23ffdc34aa576b8227f76f1b16d3782025e9e4 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                            ],
                        },
                    },
                    id: 10,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getAddressHistory',
                        params: [
                            [
                                'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                            ],
                            {
                                start: 10000000,
                                end: 0,
                                queryMempoolOnly: true,
                                from: 1,
                                to: 6,
                            },
                        ],
                    },
                    id: 12,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: {
                            totalCount: 6,
                            items: [
                                {
                                    addresses: {
                                        mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                0,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '020000000161b33cc9ce724ce662c38733a598d69f6af07ba49514d9e33c9b6a13a7da0a7f000000004847304402204dc0783fd47e26b9dee5cd352c7136c6f6200e203cfa4951afc051b2f8749250022045bf8a71a5a2a167288f6a698c57e98e11867454ea5906220fdc9e7059b24fe801feffffff0200e1f505000000001976a9143732c8fb478ca48165d686f70125e0ed223f364188ac40ce4a1f000000001976a9140a51f5d9832ef732150f81807c2d7a9982c179d788ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: 'e0b48392659feb13325c6222cb30c5f10db4cdff673177ab6455c618356aa933',
                                        locktime: 902,
                                        size: 191,
                                        inputs: [
                                            {
                                                prevTxId: '7f0adaa7136a9b3ce3d91495a47bf06a9fd698a53387c362e64c72cec93cb361',
                                                outputIndex: 0,
                                                script: '47304402204dc0783fd47e26b9dee5cd352c7136c6f6200e203cfa4951afc051b2f8749250022045bf8a71a5a2a167288f6a698c57e98e11867454ea5906220fdc9e7059b24fe801',
                                                scriptAsm: '304402204dc0783fd47e26b9dee5cd352c7136c6f6200e203cfa4951afc051b2f8749250022045bf8a71a5a2a167288f6a698c57e98e11867454ea5906220fdc9e7059b24fe8[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 100000000,
                                                script: '76a9143732c8fb478ca48165d686f70125e0ed223f364188ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 3732c8fb478ca48165d686f70125e0ed223f3641 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                            },
                                            {
                                                satoshis: 524996160,
                                                script: '76a9140a51f5d9832ef732150f81807c2d7a9982c179d788ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 0a51f5d9832ef732150f81807c2d7a9982c179d7 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mgTXEgEfpGtuC6imnZU8hCBssafBEz3xgi',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                                {
                                    addresses: {
                                        mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                1,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '02000000016e9d3d44b7c371e3221c45d42f79e0a8e764d4e748cad88562700267433f221f00000000494830450221008d592c419aafdb8f677025db7f38ae546d8c16943fea9869286201782f993a12022023a1bdb03f99db9eb0062a33b879933538cc44875669645b1e4a617036c09e0701feffffff0240ce4a1f000000001976a9144b7345dac0bd0d956ff72370c6749103969ad5f988ac00e1f505000000001976a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: 'fddec931105b2555b6d0c6e03c654fce064e4d2212e1fec2219d4c97bfff8923',
                                        locktime: 902,
                                        size: 192,
                                        inputs: [
                                            {
                                                prevTxId: '1f223f436702706285d8ca48e7d464e7a8e0792fd4451c22e371c3b7443d9d6e',
                                                outputIndex: 0,
                                                script: '4830450221008d592c419aafdb8f677025db7f38ae546d8c16943fea9869286201782f993a12022023a1bdb03f99db9eb0062a33b879933538cc44875669645b1e4a617036c09e0701',
                                                scriptAsm: '30450221008d592c419aafdb8f677025db7f38ae546d8c16943fea9869286201782f993a12022023a1bdb03f99db9eb0062a33b879933538cc44875669645b1e4a617036c09e07[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 524996160,
                                                script: '76a9144b7345dac0bd0d956ff72370c6749103969ad5f988ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 4b7345dac0bd0d956ff72370c6749103969ad5f9 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mnPu4jur3yL2mozJiM1ZWJoYLdWoutxykF',
                                            },
                                            {
                                                satoshis: 100000000,
                                                script: '76a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 9187090295b4901cd9e902fdd7d5bff7fd6dd870 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                                {
                                    addresses: {
                                        n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                0,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '0200000001088d3695724f9974dba7018bc26c6fd7056f04f4a7238aebc3a03a6b86cf47ca0000000049483045022100d813498e9c27c24284ba05ec1eae784692ee25257bd7056e81d5b8bafd66d51302204999038cc2c31c55a7a336a763f4a4c4cb410c2c1e8b34c1d520f5522f75afd301feffffff0200e1f505000000001976a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac40ce4a1f000000001976a9146ce2fcfa2aee4544db61dbad0f09e62431ca646b88ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: '7767846399872f3d84e5a030651608ba2c373feb0cf61fe44fbcac9b4b2012cc',
                                        locktime: 902,
                                        size: 192,
                                        inputs: [
                                            {
                                                prevTxId: 'ca47cf866b3aa0c3eb8a23a7f4046f05d76f6cc28b01a7db74994f7295368d08',
                                                outputIndex: 0,
                                                script: '483045022100d813498e9c27c24284ba05ec1eae784692ee25257bd7056e81d5b8bafd66d51302204999038cc2c31c55a7a336a763f4a4c4cb410c2c1e8b34c1d520f5522f75afd301',
                                                scriptAsm: '3045022100d813498e9c27c24284ba05ec1eae784692ee25257bd7056e81d5b8bafd66d51302204999038cc2c31c55a7a336a763f4a4c4cb410c2c1e8b34c1d520f5522f75afd3[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 100000000,
                                                script: '76a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 ec23ffdc34aa576b8227f76f1b16d3782025e9e4 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                            },
                                            {
                                                satoshis: 524996160,
                                                script: '76a9146ce2fcfa2aee4544db61dbad0f09e62431ca646b88ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 6ce2fcfa2aee4544db61dbad0f09e62431ca646b OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mqShCBqzsipjYCHA5jzcwrgHuLBgTqsfvk',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                                {
                                    addresses: {
                                        mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                1,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '020000000175d7a86f03d955f9b2d73f7daa92d4eb47c9282e6cdbdf00911bd6d1654c71f70000000049483045022100fc860eeb12809fe38ced2db5a9c866752ae75b2d8bd81f42e08e47345b3a374102205dced01525c6174f482e42fcd85de6419fb88dc84ecb388d04fd42bd4816576401feffffff0240ce4a1f000000001976a9145044bd4f4267eb5450402996dc305404e178112888ac00e1f505000000001976a9143732c8fb478ca48165d686f70125e0ed223f364188ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: '6e53a9727b2e28923c6348cfd55b73dccf3a342664394fc40a8fad48982b2c76',
                                        locktime: 902,
                                        size: 192,
                                        inputs: [
                                            {
                                                prevTxId: 'f7714c65d1d61b9100dfdb6c2e28c947ebd492aa7d3fd7b2f955d9036fa8d775',
                                                outputIndex: 0,
                                                script: '483045022100fc860eeb12809fe38ced2db5a9c866752ae75b2d8bd81f42e08e47345b3a374102205dced01525c6174f482e42fcd85de6419fb88dc84ecb388d04fd42bd4816576401',
                                                scriptAsm: '3045022100fc860eeb12809fe38ced2db5a9c866752ae75b2d8bd81f42e08e47345b3a374102205dced01525c6174f482e42fcd85de6419fb88dc84ecb388d04fd42bd48165764[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 524996160,
                                                script: '76a9145044bd4f4267eb5450402996dc305404e178112888ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 5044bd4f4267eb5450402996dc305404e1781128 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mnqNhWBhJJBj7YBrJsFsXUtwFk3jWzZDgB',
                                            },
                                            {
                                                satoshis: 100000000,
                                                script: '76a9143732c8fb478ca48165d686f70125e0ed223f364188ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 3732c8fb478ca48165d686f70125e0ed223f3641 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                                {
                                    addresses: {
                                        mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv: {
                                            inputIndexes: [],
                                            outputIndexes: [
                                                0,
                                            ],
                                        },
                                    },
                                    satoshis: 100000000,
                                    confirmations: 0,
                                    tx: {
                                        hex: '02000000017f971cfdf41412a4d6fb8e4fdee05145b88ddab326c9ab97a97b596aabfa97f20000000049483045022100c6de99ddcb0944f61dfcad07cdb2981ee7ee2a9eef88f8e646214df3fb7f1b2a022007e4fded62f5e0407417fc0580e473b56000eb5d1f0d001ac38af330ae061ded01feffffff0200e1f505000000001976a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac40ce4a1f000000001976a914893893f15e73899afe8beff1947b07cebe2c4bbe88ac86030000',
                                        height: -1,
                                        version: 2,
                                        hash: '1bc5d5f51d99381330eb73c6e9877c9eb17fe32399230c361fceb85510c7abac',
                                        locktime: 902,
                                        size: 192,
                                        inputs: [
                                            {
                                                prevTxId: 'f297faab6a597ba997abc926b3da8db84551e0de4f8efbd6a41214f4fd1c977f',
                                                outputIndex: 0,
                                                script: '483045022100c6de99ddcb0944f61dfcad07cdb2981ee7ee2a9eef88f8e646214df3fb7f1b2a022007e4fded62f5e0407417fc0580e473b56000eb5d1f0d001ac38af330ae061ded01',
                                                scriptAsm: '3045022100c6de99ddcb0944f61dfcad07cdb2981ee7ee2a9eef88f8e646214df3fb7f1b2a022007e4fded62f5e0407417fc0580e473b56000eb5d1f0d001ac38af330ae061ded[ALL]',
                                                sequence: 4294967294,
                                                address: null,
                                                satoshis: 625000000,
                                            },
                                        ],
                                        inputSatoshis: 625000000,
                                        outputs: [
                                            {
                                                satoshis: 100000000,
                                                script: '76a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 9187090295b4901cd9e902fdd7d5bff7fd6dd870 OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                                            },
                                            {
                                                satoshis: 524996160,
                                                script: '76a914893893f15e73899afe8beff1947b07cebe2c4bbe88ac',
                                                scriptAsm: 'OP_DUP OP_HASH160 893893f15e73899afe8beff1947b07cebe2c4bbe OP_EQUALVERIFY OP_CHECKSIG',
                                                address: 'mt2WeSG2hFURbq9BsPX4ahLTBt8s5Urccd',
                                            },
                                        ],
                                        outputSatoshis: 624996160,
                                        feeSatoshis: 3840,
                                    },
                                },
                            ],
                        },
                    },
                    id: 12,
                },
            }];
            const spec = commStart.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.lookupTransactions(['mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa', 'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH', 'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv'], 10000000, 0);
            const corrTxs = [
                {
                    zcash: false,
                    hex: '02000000014d003ae3f324fddcf78a8d76bb35e8c0cb1a0f6fa57041c5fdc0ba3b4c67e5ad0000000048473044022020ba68b5ff34cf93796a844593a70d2eeca7bc34c012fc03305203df5b87f7bf0220565dd3b76b0a8588a6c4581bb0b36d203edadcd976717da99c9941de52fbdc5301feffffff0240ce4a1f000000001976a9140881a6bae1125d60a614ec2965225687a076ca3a88ac00e1f505000000001976a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac86030000',
                    height: null,
                    timestamp: null,
                    hash: 'ee9a9b333e6e7ba39b58234c990a3fe71890f93f9894b1f872fc4bf972d58b1b',
                    inputAddresses: [
                        null,
                    ],
                    outputAddresses: [
                        'mgHw1vCvZidX8n4gPa4VqMnGjLXHNqjtj2',
                        'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                    ],
                    vsize: 191,
                },
                {
                    zcash: false,
                    hex: '020000000161b33cc9ce724ce662c38733a598d69f6af07ba49514d9e33c9b6a13a7da0a7f000000004847304402204dc0783fd47e26b9dee5cd352c7136c6f6200e203cfa4951afc051b2f8749250022045bf8a71a5a2a167288f6a698c57e98e11867454ea5906220fdc9e7059b24fe801feffffff0200e1f505000000001976a9143732c8fb478ca48165d686f70125e0ed223f364188ac40ce4a1f000000001976a9140a51f5d9832ef732150f81807c2d7a9982c179d788ac86030000',
                    height: null,
                    timestamp: null,
                    hash: 'e0b48392659feb13325c6222cb30c5f10db4cdff673177ab6455c618356aa933',
                    inputAddresses: [
                        null,
                    ],
                    outputAddresses: [
                        'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                        'mgTXEgEfpGtuC6imnZU8hCBssafBEz3xgi',
                    ],
                    vsize: 191,
                },
                {
                    zcash: false,
                    hex: '02000000016e9d3d44b7c371e3221c45d42f79e0a8e764d4e748cad88562700267433f221f00000000494830450221008d592c419aafdb8f677025db7f38ae546d8c16943fea9869286201782f993a12022023a1bdb03f99db9eb0062a33b879933538cc44875669645b1e4a617036c09e0701feffffff0240ce4a1f000000001976a9144b7345dac0bd0d956ff72370c6749103969ad5f988ac00e1f505000000001976a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac86030000',
                    height: null,
                    timestamp: null,
                    hash: 'fddec931105b2555b6d0c6e03c654fce064e4d2212e1fec2219d4c97bfff8923',
                    inputAddresses: [
                        null,
                    ],
                    outputAddresses: [
                        'mnPu4jur3yL2mozJiM1ZWJoYLdWoutxykF',
                        'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                    ],
                    vsize: 192,
                },
                {
                    zcash: false,
                    hex: '0200000001088d3695724f9974dba7018bc26c6fd7056f04f4a7238aebc3a03a6b86cf47ca0000000049483045022100d813498e9c27c24284ba05ec1eae784692ee25257bd7056e81d5b8bafd66d51302204999038cc2c31c55a7a336a763f4a4c4cb410c2c1e8b34c1d520f5522f75afd301feffffff0200e1f505000000001976a914ec23ffdc34aa576b8227f76f1b16d3782025e9e488ac40ce4a1f000000001976a9146ce2fcfa2aee4544db61dbad0f09e62431ca646b88ac86030000',
                    height: null,
                    timestamp: null,
                    hash: '7767846399872f3d84e5a030651608ba2c373feb0cf61fe44fbcac9b4b2012cc',
                    inputAddresses: [
                        null,
                    ],
                    outputAddresses: [
                        'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                        'mqShCBqzsipjYCHA5jzcwrgHuLBgTqsfvk',
                    ],
                    vsize: 192,
                },
                {
                    zcash: false,
                    hex: '020000000175d7a86f03d955f9b2d73f7daa92d4eb47c9282e6cdbdf00911bd6d1654c71f70000000049483045022100fc860eeb12809fe38ced2db5a9c866752ae75b2d8bd81f42e08e47345b3a374102205dced01525c6174f482e42fcd85de6419fb88dc84ecb388d04fd42bd4816576401feffffff0240ce4a1f000000001976a9145044bd4f4267eb5450402996dc305404e178112888ac00e1f505000000001976a9143732c8fb478ca48165d686f70125e0ed223f364188ac86030000',
                    height: null,
                    timestamp: null,
                    hash: '6e53a9727b2e28923c6348cfd55b73dccf3a342664394fc40a8fad48982b2c76',
                    inputAddresses: [
                        null,
                    ],
                    outputAddresses: [
                        'mnqNhWBhJJBj7YBrJsFsXUtwFk3jWzZDgB',
                        'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                    ],
                    vsize: 192,
                },
                {
                    zcash: false,
                    hex: '02000000017f971cfdf41412a4d6fb8e4fdee05145b88ddab326c9ab97a97b596aabfa97f20000000049483045022100c6de99ddcb0944f61dfcad07cdb2981ee7ee2a9eef88f8e646214df3fb7f1b2a022007e4fded62f5e0407417fc0580e473b56000eb5d1f0d001ac38af330ae061ded01feffffff0200e1f505000000001976a9149187090295b4901cd9e902fdd7d5bff7fd6dd87088ac40ce4a1f000000001976a914893893f15e73899afe8beff1947b07cebe2c4bbe88ac86030000',
                    height: null,
                    timestamp: null,
                    hash: '1bc5d5f51d99381330eb73c6e9877c9eb17fe32399230c361fceb85510c7abac',
                    inputAddresses: [
                        null,
                    ],
                    outputAddresses: [
                        'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                        'mt2WeSG2hFURbq9BsPX4ahLTBt8s5Urccd',
                    ],
                    vsize: 192,
                },
            ];
            let txs = [];
            s.then((t) => { txs = t; });
            setTimeout(() => {
                assert.deepStrictEqual(txs, corrTxs);
                blockchain.destroy().then(() => done());
            }, 300);
        });

        it('rejects when error returned', (done) => {
            const commMiddle = [{
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getAddressHistory',
                        params: [
                            [
                                'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                            ],
                            {
                                start: 10000000,
                                end: 0,
                                queryMempoolOnly: true,
                                from: 0,
                                to: 1,
                            },
                        ],
                    },
                    id: 10,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getAddressHistory',
                        params: [
                            [
                                'mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa',
                                'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH',
                                'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv',
                            ],
                            {
                                start: 10000000,
                                end: 0,
                                queryMempol: false,
                                from: 0,
                                to: 1,
                            },
                        ],
                    },
                    id: 11,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        error: {
                            message: 'Some error',
                        },
                    },
                    id: 11,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        error: {
                            message: 'Some error',
                        },
                    },
                    id: 10,
                },
            },
            ];
            const spec = commStart.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.lookupTransactions(['mkYpJDNquegLmPBzUNb1Up6F5cLZntzNYa', 'n33YtcSh7WsfCjgXwmJtkE4tSHCnXwfamH', 'mtnS3H9s1Y5xkhTgssvq8BjvFP6FD1D4bv'], 10000000, 0);
            let err;
            s.catch((e) => { err = e; });
            setTimeout(() => {
                assert.deepStrictEqual(err.message, 'Some error');
                blockchain.destroy().then(() => done());
            }, 300);
        });
    });

    describe('lookupTransactionsIds', () => {
        it('looks up ids', (done) => {
            const commMiddle = [
                {
                    type: 'in',
                    spec: {
                        type: 'send',
                        message: {
                            method: 'getAddressTxids',
                            params: [
                                [
                                    'n3M4CXvb6gw4tsKW6gcsYyREzPpqcrivAd',
                                ],
                                {
                                    start: 10000000,
                                    end: 0,
                                    queryMempoolOnly: true,
                                },
                            ],
                        },
                        id: 10,
                    },
                },
                {
                    type: 'in',
                    spec: {
                        type: 'send',
                        message: {
                            method: 'getAddressTxids',
                            params: [
                                [
                                    'n3M4CXvb6gw4tsKW6gcsYyREzPpqcrivAd',
                                ],
                                {
                                    start: 10000000,
                                    end: 0,
                                    queryMempool: false,
                                },
                            ],
                        },
                        id: 11,
                    },
                },
                {
                    type: 'out',
                    spec: {
                        type: 'sendReply',
                        reply: {
                            result: [],
                        },
                        id: 11,
                    },
                },
                {
                    type: 'out',
                    spec: {
                        type: 'sendReply',
                        reply: {
                            result: [
                                'f7081e708b1fd6a1deb4259a128c299aac756b5442f06efe7dea0aa695952f2d',
                            ],
                        },
                        id: 10,
                    },
                },

            ];
            const spec = commStart.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.lookupTransactionsIds(['n3M4CXvb6gw4tsKW6gcsYyREzPpqcrivAd'], 10000000, 0);
            let res;
            s.then((e) => { res = e; });
            setTimeout(() => {
                assert.deepStrictEqual(res, ['f7081e708b1fd6a1deb4259a128c299aac756b5442f06efe7dea0aa695952f2d']);
                blockchain.destroy().then(() => done());
            }, 300);
        });
    });

    describe('sendTransaction', () => {
        it('sends transaction', (done) => {
            const commMiddle = [
                {
                    type: 'in',
                    spec: {
                        type: 'send',
                        message: {
                            method: 'sendTransaction',
                            params: [
                                'longHexNotChecked',
                            ],
                        },
                        id: 10,
                    },
                },
                {
                    type: 'out',
                    spec: {
                        type: 'sendReply',
                        reply: {
                            result:
                                'txid',

                        },
                        id: 10,
                    },
                },

            ];
            const spec = commStart.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.sendTransaction('longHexNotChecked');
            let res;
            s.then((e) => { res = e; });
            setTimeout(() => {
                assert.deepStrictEqual(res, 'txid');
                blockchain.destroy().then(() => done());
            }, 300);
        });
    });

    describe('lookupBlockhash', () => {
        it('looks up blockhash', (done) => {
            const commMiddle = [{
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getBlockHeader',
                        params: [
                            0,
                        ],
                    },
                    id: 10,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: {
                            hash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
                            version: 1,
                            confirmations: 1,
                            height: 0,
                            chainWork: '0000000000000000000000000000000000000000000000000000000000000002',
                            merkleRoot: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
                            time: 1296688602,
                            medianTime: 1296688602,
                            nonce: 2,
                            bits: '207fffff',
                            difficulty: 4.656542373906925e-10,
                        },
                    },
                    id: 10,
                },
            }];
            const spec = commStart.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.lookupBlockHash(0);
            let res;
            s.then((e) => { res = e; });
            setTimeout(() => {
                assert.deepStrictEqual(res, '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206');
                blockchain.destroy().then(() => done());
            }, 300);
        });
    });

    describe('lookupSyncStatus', () => {
        it('looks up sync status', (done) => {
            const commMiddle = [{
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getInfo',
                        params: [],
                    },
                    id: 10,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: {
                            version: 150000,
                            protocolVersion: 70015,
                            blocks: 3602,
                            timeOffset: 0,
                            connections: 0,
                            proxy: '',
                            difficulty: 4.656542373906925e-10,
                            testnet: false,
                            relayFee: 0.00001,
                            errors: '',
                            network: 'regtest',
                            subversion: '/Satoshi:0.15.0(bitcore-sl)/',
                            localServices: '000000000000000d',
                        },
                    },
                    id: 10,
                },
            }];
            const spec = commStart.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.lookupSyncStatus();
            let res;
            s.then((e) => { res = e; });
            setTimeout(() => {
                assert.deepStrictEqual(res, { height: 3602 });
                blockchain.destroy().then(() => done());
            }, 300);
        });
    });

    describe('estimate fee', () => {
        it('estimates dumb fees on dumb fee server, not skip missing', (done) => {
            const commMiddle = [{
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'estimateFee',
                        params: [
                            5,
                        ],
                    },
                    id: 10,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: 0.00020277,
                    },
                    id: 10,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'estimateFee',
                        params: [
                            6,
                        ],
                    },
                    id: 11,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: -1,
                    },
                    id: 11,
                },
            }];
            const spec = commStart.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.estimateTxFees([5, 6], false);
            let res;
            s.then((e) => { res = e; });
            setTimeout(() => {
                assert.deepStrictEqual(res, { 5: 0.00020277, 6: -1 });
                blockchain.destroy().then(() => done());
            }, 300);
        });

        it('estimates dumb fees on dumb fee server, skip missing', (done) => {
            const commMiddle = [{
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'estimateFee',
                        params: [
                            5,
                        ],
                    },
                    id: 10,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: 0.00020277,
                    },
                    id: 10,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'estimateFee',
                        params: [
                            6,
                        ],
                    },
                    id: 11,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: -1,
                    },
                    id: 11,
                },
            }];
            const spec = commStart.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.estimateTxFees([5, 6], true);
            let res;
            s.then((e) => { res = e; });
            setTimeout(() => {
                assert.deepStrictEqual(res, { 5: 0.00020277 });
                blockchain.destroy().then(() => done());
            }, 300);
        });

        it('returns -1s if estimating smart on dumb server', (done) => {
            const spec = commStart.concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.estimateSmartTxFees([5, 6], true);
            let res;
            s.then((e) => { res = e; });
            setTimeout(() => {
                assert.deepStrictEqual(res, { 5: -1, 6: -1 });
                blockchain.destroy().then(() => done());
            }, 300);
        });

        it('estimates smart on smart server', (done) => {
            const commStartSmartFees = [{
                type: 'in',
                spec: {
                    type: 'init',
                    endpoint: 'http://localhost:3005',
                    connectionType: 'websocket',
                },
            }, {
                type: 'out',
                spec: {
                    type: 'initDone',
                },
            }, {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'connect_error',
                    id: 1,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'reconnect_error',
                    id: 2,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'close',
                    id: 3,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'disconnect',
                    id: 4,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'error',
                    id: 5,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'getBlockHeader',
                        params: [
                            0,
                        ],
                    },
                    id: 6,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: {
                            hash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
                            version: 1,
                            confirmations: 1,
                            height: 0,
                            chainWork: '0000000000000000000000000000000000000000000000000000000000000002',
                            merkleRoot: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
                            time: 1296688602,
                            medianTime: 1296688602,
                            nonce: 2,
                            bits: '207fffff',
                            difficulty: 4.656542373906925e-10,
                        },
                    },
                    id: 6,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'estimateSmartFee',
                        params: [
                            2,
                            false,
                        ],
                    },
                    id: 7,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: 0.00020277,
                    },
                    id: 7,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'bitcoind/addresstxid',
                    id: 8,
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'subscribe',
                    event: 'bitcoind/hashblock',
                    values: [],
                },
            },
            {
                type: 'in',
                spec: {
                    type: 'observe',
                    event: 'bitcoind/hashblock',
                    id: 9,
                },
            }];
            const commMiddle = [{
                type: 'in',
                spec: {
                    type: 'send',
                    message: {
                        method: 'estimateSmartFee',
                        params: [
                            5,
                            true,
                        ],
                    },
                    id: 10,
                },
            },
            {
                type: 'out',
                spec: {
                    type: 'sendReply',
                    reply: {
                        result: 0.00020277,
                    },
                    id: 10,
                },
            }];
            const spec = commStartSmartFees.concat(commMiddle).concat(commEnd);
            const socketWorkerFactory = () => {
                const mock = new MockWorker(spec, done, true);
                return mock;
            };
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            const s = blockchain.estimateSmartTxFees([5], true);
            let res;
            s.then((e) => { res = e; });
            setTimeout(() => {
                assert.deepStrictEqual(res, { 5: 0.00020277 });
                blockchain.destroy().then(() => done());
            }, 300);
        });
    });
});
