/* global it:false, describe:false */

import assert from 'assert';

import {BitcoreBlockchain} from '../lib/bitcore';
import {Stream} from '../lib/utils/stream';
import {Socket} from '../lib/socketio-worker/outside';

import {run} from '../test_helpers/_node_client.js';

import {address, Transaction, networks} from 'bitcoinjs-lib-zcash';

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

function startBitcore() {
    return run('test_helpers/start_bitcore.sh')
        .then(() => new Promise(resolve => setTimeout(resolve, 15 * 1000)));
}

function stopBitcore() {
    return run('pkill bitcored')
          .then(() => new Promise(resolve => setTimeout(resolve, 15 * 1000)));
}

function testStream(stream, test, timeout, done) {
    let ended = false;
    const fun = (value, detach) => {
        ended = true;
        detach();
        try {
            if (test(value)) {
                done();
            } else {
                done(new Error('Value does not meet test.'));
            }
        } catch (e) {
            done(new Error('Value does not meet test.'));
        }
    };
    stream.values.attach(fun);
    setTimeout(() => {
        if (!ended) {
            stream.values.detach(fun);
            done(new Error('Timeout'));
        }
    }, timeout);
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
                (error) => error.message === 'All backends are offline.',
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
        let blockchain;

        it('starts bitcore + connects to it', function () {
            this.timeout(60 * 1000);
            return startBitcore().then(() => {
                blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            });
        });

        // note - bitcore.js doesn't know about versions bytes, it doesn't check address validity
        it('throws on wrong input', function () {
            for (const inputs of [['foo'], 'foo', [123], new Set([123])]) {
                try {
                    blockchain.subscribe(inputs);
                    assert(false);
                } catch (e) {
                    assert(true);
                }
            }
        });

        it('subscribes to address', function () {
            blockchain.subscribe(new Set(['mmac7YSL3AapEyMGCKHp1Jq6HiEpbztAQp']));
        });

        it('socket registers tx mined to address', function (done) {
            this.timeout(20 * 1000);
            blockchain.socket.promise.then(socket => {
                const stream = socket.observe('bitcoind/addresstxid');
                testStream(stream, a => /^[a-f0-9]{64}$/.test(a.txid), 15 * 1000, done);
                run('bitcore-regtest-cli generatetoaddress 1 mmac7YSL3AapEyMGCKHp1Jq6HiEpbztAQp');
            });
        });

        it('socket registers normal tx', function (done) {
            this.timeout(20 * 1000);
            blockchain.socket.promise.then(socket => {
                const stream = socket.observe('bitcoind/addresstxid');
                testStream(stream, a => /^[a-f0-9]{64}$/.test(a.txid), 15 * 1000, done);
                run('bitcore-regtest-cli generate 300').then(() =>
                    run('bitcore-regtest-cli sendtoaddress mmac7YSL3AapEyMGCKHp1Jq6HiEpbztAQp 1')
                );
            });
        });

        it('notifications register tx mined to address', function (done) {
            this.timeout(20 * 1000);
            const stream = blockchain.notifications;
            testStream(stream, tx => {
                // can be either 1 or 2 with second opreturn
                if (tx.outputAddresses.length > 2) {
                    return false;
                }
                if (tx.outputAddresses[0] !== 'mmac7YSL3AapEyMGCKHp1Jq6HiEpbztAQp') {
                    return false;
                }
                if (tx.zcash !== false) {
                    return false;
                }
                const bjstx = Transaction.fromHex(tx.hex, false);
                if (!bjstx.isCoinbase()) {
                    return false;
                }
                if (bjstx.getId() !== tx.hash) {
                    return false;
                }
                const raddress = address.fromOutputScript(bjstx.outs[0].script, networks.testnet);

                if (raddress !== 'mmac7YSL3AapEyMGCKHp1Jq6HiEpbztAQp') {
                    return false;
                }

                return true;
            },
            15 * 1000, done);
            run('bitcore-regtest-cli generatetoaddress 1 mmac7YSL3AapEyMGCKHp1Jq6HiEpbztAQp');
        });

        it('notifications register normal tx', function (done) {
            this.timeout(20 * 1000);

            const stream = blockchain.notifications;
            testStream(stream, tx => {
                if (tx.outputAddresses.findIndex((k) => k === 'mmac7YSL3AapEyMGCKHp1Jq6HiEpbztAQp') === -1) {
                    return false;
                }
                if (tx.zcash !== false) {
                    return false;
                }
                const bjstx = Transaction.fromHex(tx.hex, false);
                if (bjstx.isCoinbase()) {
                    return false;
                }
                if (bjstx.getId() !== tx.hash) {
                    return false;
                }
                const raddresses = bjstx.outs.map(o => address.fromOutputScript(o.script, networks.testnet));
                if (raddresses.findIndex((k) => k === 'mmac7YSL3AapEyMGCKHp1Jq6HiEpbztAQp') === -1) {
                    return false;
                }

                return true;
            },
            15 * 1000, done);

            run('bitcore-regtest-cli generate 300').then(() =>
                run('bitcore-regtest-cli sendtoaddress mmac7YSL3AapEyMGCKHp1Jq6HiEpbztAQp 1')
            );
        });

        it('stops bitcore', function () {
            this.timeout(60 * 1000);
            blockchain.destroy();
            return stopBitcore();
        });
    });
});
