/* global it:false, describe:false */

import assert from 'assert';

import {BitcoreBlockchain} from '../lib/bitcore';
import {Stream} from '../lib/utils/stream';
import {Socket} from '../lib/socketio-worker/outside';

import {startBitcore, stopBitcore, testStream, testStreamMultiple} from '../test_helpers/common.js';
import {run} from '../test_helpers/_node_client.js';

import bitcoin from 'bitcoinjs-lib-zcash';

// hack for workers in both node and browser
const socketWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        const TinyWorker = require('tiny-worker');
        return new TinyWorker(() => {
            require('babel-register');
            require('../../../lib/socketio-worker/inside.js');
        });
    } else {
        return new Worker('../../lib/socketio-worker/inside.js');
    }
};

function testBlockchain(doFirst, doLater, done) {
    const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
    blockchain.socket.promise.then(() => {
        const realDone = (anything) => { blockchain.destroy(); done(anything); };

        Promise.resolve(doFirst(blockchain, realDone)).then(() => {
            setTimeout(() => doLater(blockchain, realDone), 5 * 1000);
        });
    }, (e) => {
        done(e);
    });
}

function hasIntersection(array1, array2) {
    for (const i1 of array1) {
        for (const i2 of array2) {
            if (i1 === i2) {
                return true;
            }
        }
    }
    return false;
}

const hdnode = bitcoin.HDNode.fromBase58(
    'tprv8ZgxMBicQKsPdfrBPLV36ipU9BHcXhufs1yjchpUWjryXmWEDtciLdgUWXQBGbTqxjzgCxZxA5vMeqSmoBaFjRZLHbhBzzVGZZPmzHqHaSm',
//     'tpubDD7tXK8KeQ3YY83yWq755fHY2JW8Ha8Q765tknUM5rSvjPcGWfUppDFMpQ1ScziKfW3ZNtZvAD7M3u7bSs7HofjTD3KP3YxPK7X6hwV8Rk2',
    bitcoin.networks.testnet
);

let i = 0;
function getAddress() {
    i = i + 1;
    const addressNode = hdnode.derive(i);
    return addressNode.getAddress();
}

function makeTx(inTxHex, inTxOutputAddresses, outAddress) {
    function findInput() {
        for (let j = i; j >= 0; j--) {
            const nodeaddress = hdnode.derive(j).getAddress();
            for (let k = 0; k < inTxOutputAddresses.length; k++) {
                if (inTxOutputAddresses[k] === nodeaddress) {
                    return {
                        ecpair: hdnode.derive(j).keyPair,
                        outputid: k,
                    };
                }
            }
        }
        throw new Error('Not found');
    }

    const input = findInput();
    const transaction = bitcoin.Transaction.fromHex(inTxHex);
    const builder = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
    builder.addInput(transaction, input.outputid, 0);
    builder.addOutput(outAddress, 50000000);
    builder.sign(0, input.ecpair);
    const newTx = builder.buildIncomplete();
    return {
        hex: newTx.toHex(),
        id: newTx.getId(),
    };
}

describe('bitcore', () => {
    describe('constructor', () => {
        let blockchain;

        it('creates something', () => {
            blockchain = new BitcoreBlockchain(['https://nonsense.com'], socketWorkerFactory);
            blockchain._silent = true;
            assert.ok(blockchain);
        });

        it('looks like blockchain object before initialization', () => {
            assert.ok(blockchain.errors instanceof Stream);
            assert.ok(blockchain.notifications instanceof Stream);
            assert.ok(blockchain.blocks instanceof Stream);

            assert.ok(blockchain.addresses instanceof Set);

            assert.ok(blockchain.socket.promise instanceof Promise);
            assert.ok(blockchain.endpoints instanceof Array);
            assert.ok(blockchain.workingUrl === 'none');
            assert.ok(typeof blockchain.zcash === 'boolean');
        });

        describe('Blockchain interface on unitialized blockchain', () => {
            it('returns void on subscribe', () => {
                assert.ok(blockchain.subscribe(new Set(['abcd'])) == null);
            });
            it('returns Stream on lookupTransactionsStream', () => {
                assert.ok(blockchain.lookupTransactionsStream(['abcd'], 0, 0) instanceof Stream);
            });
            it('returns Promise on lookupTransactions', () => {
                assert.ok(blockchain.lookupTransactions(['abcd'], 0, 0).catch(() => {}) instanceof Promise);
            });
            it('returns Promise on lookupTransaction', () => {
                assert.ok(blockchain.lookupTransaction('abcd').catch(() => {}) instanceof Promise);
            });
            it('returns Promise on lookupBlockHash', () => {
                assert.ok(blockchain.lookupBlockHash(1).catch(() => {}) instanceof Promise);
            });
            it('returns Promise on lookupSyncStatus', () => {
                assert.ok(blockchain.lookupSyncStatus().catch(() => {}) instanceof Promise);
            });
            it('returns Promise on sendTransaction', () => {
                assert.ok(blockchain.sendTransaction('abcd').catch(() => {}) instanceof Promise);
                blockchain.destroy();
            });
        });

        it('socket and workingUrl are null on non-working bitcore', function (done) {
            this.timeout(20 * 1000);

            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            blockchain.socket.promise.then(() => {
                blockchain.destroy();
                done(new Error('blockchain.socket should not resolve'));
            }, () => {
                assert.ok(blockchain.workingUrl === 'none');
                blockchain.destroy();
                done();
            });
        });

        it('emits error event on non-working bitcore', function (done) {
            this.timeout(20 * 1000);

            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            testStream(
                blockchain.errors,
                (error) => assert(error.message === 'All backends are offline.'),
                19 * 1000,
                () => {
                    blockchain.destroy();
                    done();
                }
            );
        });

        it('starts bitcore', function () {
            this.timeout(60 * 1000);
            return startBitcore();
        });

        it('socket and workingUrl are as expected on working bitcore', function (done) {
            this.timeout(20 * 1000);

            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            blockchain.socket.promise.then((socket) => {
                assert.ok(socket instanceof Socket);
                assert.ok(blockchain.workingUrl === 'http://localhost:3005');
                blockchain.destroy();
                done();
            }, () => {
                blockchain.destroy();
                done(new Error('blockchain.socket rejected'));
            });
        });

        it('does not emit error event on working bitcore', function (done) {
            this.timeout(20 * 1000);

            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);

            let ended = false;
            const fun = (value, detach) => {
                ended = true;
                detach();
                blockchain.destroy();
                done(new Error('Emitted error.'));
            };
            blockchain.errors.values.attach(fun);
            setTimeout(() => {
                if (!ended) {
                    blockchain.errors.values.detach(fun);
                    blockchain.destroy();
                    done();
                }
            }, 19 * 1000);
        });

        it('stops bitcore', function () {
            this.timeout(60 * 1000);
            return stopBitcore();
        });
    });

    describe('status check', () => {
        it('starts bitcore', function () {
            this.timeout(60 * 1000);
            return startBitcore();
        });

        it('resolves on working bitcore', function () {
            this.timeout(20 * 1000);

            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            blockchain._silent = true;
            return blockchain.hardStatusCheck().then((res) => {
                assert.ok(res);
                blockchain.destroy();
            });
        });

        it('stops bitcore', function () {
            this.timeout(60 * 1000);
            return stopBitcore();
        });

        it('rejects on non-working bitcore', function () {
            this.timeout(20 * 1000);

            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            blockchain._silent = true;
            return blockchain.hardStatusCheck().then((res) => {
                blockchain.destroy();
                assert.ok(!res);
            });
        });
    });

    describe('subscribe', () => {
        it('starts bitcore', function () {
            this.timeout(20 * 1000);
            return startBitcore();
        });

        // note - bitcore.js doesn't know about versions bytes, it doesn't check address validity
        it('throws on wrong input', function () {
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            for (const inputs of [['foo'], 'foo', [123], new Set([123])]) {
                try {
                    blockchain.subscribe(inputs);
                    assert(false);
                } catch (e) {
                    assert(true);
                }
            }
            blockchain.destroy();
        });

        it('socket registers tx mined to address', function (done) {
            this.timeout(30 * 1000);
            const address = getAddress();

            testBlockchain((blockchain, done) => {
                blockchain.subscribe(new Set([address]));
                blockchain.socket.promise.then(socket => {
                    const stream = socket.observe('bitcoind/addresstxid');
                    testStream(stream, a => assert(/^[a-f0-9]{64}$/.test(a.txid)), 20 * 1000, done);
                });
            }, () => run('bitcore-regtest-cli generatetoaddress 1 ' + address), done);
        });

        it('socket registers normal tx', function (done) {
            this.timeout(30 * 1000);
            const address = getAddress();

            testBlockchain((blockchain, done) => {
                blockchain.subscribe(new Set([address]));
                blockchain.socket.promise.then(socket => {
                    const stream = socket.observe('bitcoind/addresstxid');
                    testStream(stream, a => assert(/^[a-f0-9]{64}$/.test(a.txid)), 20 * 1000, done);
                });
            }, () => {
                run('bitcore-regtest-cli generate 300').then(() =>
                    run('bitcore-regtest-cli sendtoaddress ' + address + ' 1')
                );
            }, done);
        });

        it('notifications register tx mined to address', function (done) {
            this.timeout(30 * 1000);
            const saddress = getAddress();

            testBlockchain((blockchain, done) => {
                const stream = blockchain.notifications;
                blockchain.subscribe(new Set([saddress]));

                testStream(stream, tx => {
                    // can be either 1 or 2 with second opreturn
                    assert(tx.outputAddresses.length <= 2);
                    assert(tx.outputAddresses[0] === saddress);
                    assert(tx.zcash === false);
                    assert(/^[0-9]+$/.test(tx.fee) && tx.fee === 0);
                    assert(tx.vsize === tx.hex.length / 2);
                    const bjstx = bitcoin.Transaction.fromHex(tx.hex, false);
                    assert(bjstx.isCoinbase());
                    assert(bjstx.getId() === tx.hash);
                    const raddress = bitcoin.address.fromOutputScript(bjstx.outs[0].script, bitcoin.networks.testnet);

                    assert(raddress === saddress);
                },
                20 * 1000, done);
            }, () => run('bitcore-regtest-cli generatetoaddress 1 ' + saddress), done);
        });

        let lastTx = null;
        let lastAddress = null;

        it('notifications register normal tx', function (done) {
            this.timeout(30 * 1000);
            const saddress = getAddress();

            // keep address for further tests
            lastAddress = saddress;

            testBlockchain((blockchain, done) => {
                const stream = blockchain.notifications;
                blockchain.subscribe(new Set([saddress]));

                testStream(stream, tx => {
                    assert(tx.outputAddresses.findIndex((k) => k === saddress) !== -1);
                    assert(tx.zcash === false);
                    assert(/^[0-9]+$/.test(tx.fee) && tx.fee !== 0);
                    assert(tx.vsize === tx.hex.length / 2);
                    const bjstx = bitcoin.Transaction.fromHex(tx.hex, false);
                    assert(!bjstx.isCoinbase());
                    assert(bjstx.getId() === tx.hash);
                    const raddresses = bjstx.outs.map(o => bitcoin.address.fromOutputScript(o.script, bitcoin.networks.testnet));
                    assert(raddresses.findIndex((k) => k !== saddress) !== -1);

                    // keep tx for further tests
                    lastTx = tx;
                },
                20 * 1000, done);
            }, () => {
                run('bitcore-regtest-cli generate 300').then(() =>
                    run('bitcore-regtest-cli sendtoaddress ' + saddress + ' 1')
                );
            }, done);
        });

        it('socket registers outgoing tx', function (done) {
            this.timeout(30 * 1000);
            if (lastTx == null) {
                done(new Error('previous null'));
            }
            const outAddress = getAddress();

            testBlockchain((blockchain, done) => {
                blockchain.subscribe(new Set([lastAddress]));
                blockchain.socket.promise.then(socket => {
                    const stream = socket.observe('bitcoind/addresstxid');
                    testStream(stream, a => assert(/^[a-f0-9]{64}$/.test(a.txid)), 20 * 1000, done);
                });
            }, () => {
                const outTx = makeTx(lastTx.hex, lastTx.outputAddresses, outAddress).hex;
                run('bitcore-regtest-cli sendrawtransaction "' + outTx + '" true');
            }, done);
        });
    });

    describe('lookupTransactionsStream', () => {
        it('looks up unconfirmed transactions', function (done) {
            this.timeout(2 * 60 * 1000);
            const addresses = [getAddress(), getAddress(), getAddress()];

            testBlockchain(() => {
                let p = run('bitcore-regtest-cli generate 300');

                for (let i = 0; i < 100; i++) {
                    p = p
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[0] + ' 1'))
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[1] + ' 1'))
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[2] + ' 1'));
                }
                return p;
            }, (blockchain, done) => {
                const stream = blockchain.lookupTransactionsStream(addresses, 10000000, 0);

                testStreamMultiple(stream, (tx) => {
                    assert(hasIntersection(tx.outputAddresses, addresses));
                    assert(tx.zcash === false);
                    assert(/^[0-9]+$/.test(tx.fee) && tx.fee !== 0);
                    assert(tx.vsize === tx.hex.length / 2);
                    const bjstx = bitcoin.Transaction.fromHex(tx.hex, false);
                    assert(!bjstx.isCoinbase());
                    assert(bjstx.getId() === tx.hash);
                    const raddresses = bjstx.outs.map(o => bitcoin.address.fromOutputScript(o.script, bitcoin.networks.testnet));
                    assert(hasIntersection(raddresses, addresses));
                    assert(tx.height == null);
                    assert(tx.timestamp == null);
                }, 30 * 1000, done, 100 * 3);
            }, done);
        });

        it('looks up confirmed transactions', function (done) {
            this.timeout(2 * 60 * 1000);
            const addresses = [getAddress(), getAddress(), getAddress()];

            testBlockchain(() => {
                let p = run('bitcore-regtest-cli generate 300');

                for (let i = 0; i < 100; i++) {
                    p = p
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[0] + ' 1'))
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[1] + ' 1'))
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[2] + ' 1'));
                }
                p = p.then(() => run('bitcore-regtest-cli generate 300'));
                return p;
            }, (blockchain, done) => {
                const stream = blockchain.lookupTransactionsStream(addresses, 10000000, 0);

                testStreamMultiple(stream, (tx) => {
                    assert(hasIntersection(tx.outputAddresses, addresses));
                    assert(tx.zcash === false);
                    assert(/^[0-9]+$/.test(tx.fee) && tx.fee !== 0);
                    assert(tx.vsize === tx.hex.length / 2);
                    const bjstx = bitcoin.Transaction.fromHex(tx.hex, false);
                    assert(!bjstx.isCoinbase());
                    assert(bjstx.getId() === tx.hash);
                    const raddresses = bjstx.outs.map(o => bitcoin.address.fromOutputScript(o.script, bitcoin.networks.testnet));
                    assert(hasIntersection(raddresses, addresses));
                    assert(tx.height != null);
                    assert(tx.timestamp != null);
                }, 30 * 1000, done, 100 * 3);
            }, done);
        });

        it('streams error when sent error from bitcore', function (done) {
            this.timeout(10 * 1000);
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);

            const addresses = [getAddress(), getAddress(), getAddress()];

            const stream = blockchain.lookupTransactionsStream(addresses, 0, 10000000);

            testStream(stream, (e) => {
                assert(typeof e === 'object' && e instanceof Error);
            }, 20 * 1000, done);
        });

        it('streams error when bitcore turned off', function (done) {
            this.timeout(60 * 1000);
            const addresses = [getAddress(), getAddress(), getAddress()];

            testBlockchain(() => {
                return stopBitcore();
            }, (blockchain, done) => {
                const stream = blockchain.lookupTransactionsStream(addresses, 10000000, 0);

                testStreamMultiple(stream, (e) => {
                    assert(typeof e === 'object' && e instanceof Error);
                }, 30 * 1000, done, 2);
            }, done);
        });

        it('starts bitcore', function () {
            this.timeout(60 * 1000);
            return startBitcore();
        });

        it('streams error when bitcore turned off during action', function (done) {
            this.timeout(10 * 60 * 1000);
            const addresses = [getAddress(), getAddress(), getAddress()];

            testBlockchain(() => {
                let p = Promise.resolve();

                for (let i = 0; i < 100; i++) {
                    p = p
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[0] + ' 1'))
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[1] + ' 1'))
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[2] + ' 1'));
                }
                p = p.then(() => run('bitcore-regtest-cli generate 300'));
                return p;
            }, (blockchain, done) => {
                stopBitcore().then(() => {
                    const stream = blockchain.lookupTransactionsStream(addresses, 10000000, 0);

                    testStreamMultiple(stream, (e) => {
                        assert(typeof e === 'object' && e instanceof Error);
                    }, 30 * 1000, done, 1);
                });
            }, done);
        });
    });

    function testTxsPromise(promise, test, done) {
        promise.then((txs) => {
            for (const tx of txs) {
                test(tx);
            }
            done();
        },
        (error) => {
            if (error != null) {
                done(error);
            } else {
                done(new Error());
            }
        });
    }

    let lastTx = null;

    describe('lookupTransactions', () => {
        it('starts bitcore', function () {
            this.timeout(60 * 1000);
            return startBitcore();
        });

        it('looks up unconfirmed transactions', function (done) {
            this.timeout(2 * 60 * 1000);
            const addresses = [getAddress(), getAddress(), getAddress()];

            testBlockchain(() => {
                let p = run('bitcore-regtest-cli generate 300');

                for (let i = 0; i < 100; i++) {
                    p = p
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[0] + ' 1'))
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[1] + ' 1'))
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[2] + ' 1'));
                }
                return p;
            }, (blockchain, done) => {
                const promise = blockchain.lookupTransactions(addresses, 10000000, 0);

                testTxsPromise(promise, (tx) => {
                    assert(hasIntersection(tx.outputAddresses, addresses));
                    assert(tx.zcash === false);
                    assert(/^[0-9]+$/.test(tx.fee) && tx.fee !== 0);
                    assert(tx.vsize === tx.hex.length / 2);
                    const bjstx = bitcoin.Transaction.fromHex(tx.hex, false);
                    assert(!bjstx.isCoinbase());
                    assert(bjstx.getId() === tx.hash);
                    const raddresses = bjstx.outs.map(o => bitcoin.address.fromOutputScript(o.script, bitcoin.networks.testnet));
                    assert(hasIntersection(raddresses, addresses));
                    assert(tx.height == null);
                    assert(tx.timestamp == null);
                }, done);
            }, done);
        });

        it('looks up confirmed transactions', function (done) {
            this.timeout(5 * 60 * 1000);
            const addresses = [getAddress(), getAddress(), getAddress()];

            testBlockchain(() => {
                let p = run('bitcore-regtest-cli generate 300');

                for (let i = 0; i < 100; i++) {
                    p = p
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[0] + ' 1'))
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[1] + ' 1'))
                        .then(() => run('bitcore-regtest-cli sendtoaddress ' + addresses[2] + ' 1'));
                }
                p = p.then(() => run('bitcore-regtest-cli generate 300'));
                return p;
            }, (blockchain, done) => {
                const promise = blockchain.lookupTransactions(addresses, 10000000, 0);

                testTxsPromise(promise, (tx) => {
                    assert(hasIntersection(tx.outputAddresses, addresses));
                    assert(tx.zcash === false);
                    assert(/^[0-9]+$/.test(tx.fee) && tx.fee !== 0);
                    assert(tx.vsize === tx.hex.length / 2);
                    const bjstx = bitcoin.Transaction.fromHex(tx.hex, false);
                    assert(!bjstx.isCoinbase());
                    assert(bjstx.getId() === tx.hash);
                    const raddresses = bjstx.outs.map(o => bitcoin.address.fromOutputScript(o.script, bitcoin.networks.testnet));
                    assert(hasIntersection(raddresses, addresses));
                    assert(tx.height != null);
                    assert(tx.timestamp != null);

                    // keep tx for further tests
                    lastTx = tx;
                }, done);
            }, done);
        });

        it('streams error when sent error from bitcore', function (done) {
            this.timeout(10 * 1000);
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);

            const addresses = [getAddress(), getAddress(), getAddress()];

            const promise = blockchain.lookupTransactions(addresses, 0, 10000000);

            promise.then(() => {
                done(new Error('Should reject.'));
            }, () => {
                done();
            });
        });
    });

    describe('sync status', () => {
        it('looks up sync status', function (done) {
            this.timeout(30 * 1000);
            if (lastTx == null) {
                done(new Error('previous null'));
            }
            testBlockchain((blockchain, done) => {
                blockchain.lookupSyncStatus().then(oldStatus => {
                    return run('bitcore-regtest-cli generate 300').then(() => {
                        return blockchain.lookupSyncStatus().then(newStatus => {
                            assert(typeof oldStatus.height === 'number');
                            assert(typeof newStatus.height === 'number');
                            assert(newStatus.height > oldStatus.height);
                            done();
                        });
                    });
                }).catch((e) => {
                    done(e);
                });
            }, () => {}, done);
        });
    });

    describe('blockhash', () => {
        it('looks up blockhash', function (done) {
            this.timeout(30 * 1000);
            if (lastTx == null) {
                done(new Error('previous null'));
            }
            testBlockchain((blockchain, done) => {
                blockchain.lookupBlockHash(0).then(hash => {
                    assert(hash === '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206');
                    done();
                }).catch((e) => {
                    done(e);
                });
            }, () => {}, done);
        });
    });

    describe('lookupTransaction + sendTransaction', () => {
        let outTx;

        it('sends tx', function (done) {
            this.timeout(30 * 1000);
            if (lastTx == null) {
                done(new Error('previous null'));
            }
            const outAddress = getAddress();

            testBlockchain((blockchain, done) => {
                outTx = makeTx(lastTx.hex, lastTx.outputAddresses, outAddress);
                blockchain.sendTransaction(outTx.hex, true).then(id => {
                    assert(outTx.id === id);
                    done();
                }, err => done(err));
            }, () => {}, done);
        });

        it('looks up tx', function (done) {
            this.timeout(30 * 1000);
            if (lastTx == null) {
                done(new Error('previous null'));
            }
            testBlockchain((blockchain, done) => {
                blockchain.lookupTransaction(outTx.id).then((tx) => {
                    assert(tx.hash === outTx.id);
                    done();
                }, err => done(err));
            }, () => {}, done);
        });
    });

    describe('estimatetx fees', () => {
        it('estimates something', function (done) {
            this.timeout(60 * 1000);
            testBlockchain((blockchain, done) => {
                blockchain.estimateTxFees([5, 6, 7], false).then(res => {
                    assert(typeof res === 'object');
                    assert(Object.keys(res).length === 3);
                    assert(5 in res);
                    assert(6 in res);
                    assert(7 in res);
                    Object.keys(res).forEach((key) => {
                        // note - estimations are now all -1 most probably
                        assert((/(^0.\d+$)|(^-1$)/).test(res[key]));
                    });
                    done();
                });
            }, () => {}, done);
        });
    });

    describe('estimate smart tx fees', () => {
        it('estimates something', function (done) {
            this.timeout(60 * 1000);
            testBlockchain((blockchain, done) => {
                blockchain.estimateSmartTxFees([5, 6, 7], false).then(res => {
                    assert(typeof res === 'object');
                    assert(Object.keys(res).length === 3);
                    assert(5 in res);
                    assert(6 in res);
                    assert(7 in res);
                    Object.keys(res).forEach((key) => {
                        // note - estimations are now all -1 most probably
                        assert((/(^0.\d+$)|(^-1$)/).test(res[key]));
                    });
                    done();
                });
            }, () => {}, done);
        });
    });

    describe('disconnect errors', () => {
        it('throws error on disconnect', function (done) {
            this.timeout(30 * 1000);

            testBlockchain((blockchain, done) => {
                testStream(blockchain.errors, a => a instanceof Error, 20 * 1000, done);
            }, () => stopBitcore(), done);
        });
    });
});
