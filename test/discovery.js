/* global it:false, describe:false */

import assert from 'assert';
import bitcoin from 'bitcoinjs-lib-zcash';

import {promiseTimeout, startBitcore, stopBitcore, testStream} from '../test_helpers/common.js';
import {run} from '../test_helpers/_node_client.js';
import {WorkerChannel} from '../lib/utils/simple-worker-channel';
import {BitcoreBlockchain} from '../lib/bitcore';
import {WorkerDiscovery} from '../lib/discovery/worker-discovery';
import {Stream} from '../lib/utils/stream';

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
            requireHack('../../../lib/discovery/worker/inside/index.js');
        });
    } else {
        return new Worker('../../lib/discovery/worker/inside/index.js');
    }
};

const cryptoWorkerFactory = () => {
    if (typeof Worker === 'undefined') {
        const TinyWorker = require('tiny-worker');
        return new TinyWorker(() => {
            // Terrible hack
            // Browserify throws error if I don't do this
            // Maybe it could be fixed with noParse instead of eval, but I don't know how,
            // since this is all pretty hacky anyway
            // eslint-disable-next-line no-eval
            const requireHack = eval('req' + 'uire');
            requireHack('../../../lib/trezor-crypto/emscripten/trezor-crypto.js');
        });
    } else {
        return new Worker('../../lib/trezor-crypto/emscripten/trezor-crypto.js');
    }
};

const cryptoWorker = cryptoWorkerFactory();
const addressChannel = new WorkerChannel(cryptoWorker);

function reversePromise(p) {
    return p.then(
        () => Promise.reject('Not rejected'),
        () => {}
    );
}

function testDiscovery(discovery, xpub, testfun, last) {
    const stream = discovery.discoverAccount(
        last,
        xpub,
        bitcoin.networks.testnet,
        'off'
    );
    return stream.ending.then((res) => {
        assert(/^[0-9]+$/.test(res.lastBlock.height));
        assert(/^[0-9a-f]+$/.test(res.lastBlock.hash));

        testfun(res);
    });
}

describe('discovery', () => {
    let discovery;
    let blockchain;
    const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';

    it('starts bitcore', function () {
        this.timeout(60 * 1000);
        return startBitcore().then(() => {
            return run('bitcore-regtest-cli generate 300');
        });
    });

    it('creates something', () => {
        blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
        discovery = new WorkerDiscovery(discoveryWorkerFactory, addressChannel, blockchain);
        assert.ok(discovery);
    });

    it('does some discovery', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, () => true);
    });

    let lastEmpty;
    function testEmpty(info) {
        lastEmpty = info;
        assert(info.utxos.length === 0);
        assert(info.usedAddresses.length === 0);
        assert(info.changeAddresses.length === 20);
        assert(info.changeAddresses[0] === 'mm6kLYbGEL1tGe4ZA8xacfgRPdW1NLjCbZ');
        assert(info.changeAddresses[1] === 'mjXZwmEi1z1MzveZrKUAo4DBgbdq4sBYT6');
        assert(info.unusedAddresses.length === 20);
        assert(info.unusedAddresses[0] === 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q');
        assert(info.unusedAddresses[1] === 'mopZWqZZyQc3F2Sy33cvDtJchSAMsnLi7b');
        assert(info.changeIndex === 0);
        assert(info.allowChange);
        assert(info.balance === 0);
        assert(Object.keys(info.sentAddresses).length === 0);
        assert(info.transactions.length === 0);
    }

    it('returns empty on empty account', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, testEmpty);
    });

    it('continuing empty is still empty', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, testEmpty, lastEmpty);
    });

    let lastUnconf;

    function testUnconf(info) {
        lastUnconf = info;
        const btc = 1e8;
        assert(info.utxos.length === 1);
        assert(info.utxos[0].height === null);
        assert(info.usedAddresses.length === 1);
        assert(info.usedAddresses[0].address === 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q');
        assert(info.usedAddresses[0].received === btc);
        assert(info.changeAddresses.length === 20);
        assert(info.changeAddresses[0] === 'mm6kLYbGEL1tGe4ZA8xacfgRPdW1NLjCbZ');
        assert(info.changeAddresses[1] === 'mjXZwmEi1z1MzveZrKUAo4DBgbdq4sBYT6');
        assert(info.unusedAddresses.length === 19);
        assert(info.unusedAddresses[0] === 'mopZWqZZyQc3F2Sy33cvDtJchSAMsnLi7b');
        assert(info.changeIndex === 0);
        assert(info.allowChange);
        assert(info.balance === btc);
        assert(Object.keys(info.sentAddresses).length === 0);
        assert(info.transactions.length === 1);
        const t = info.transactions[0];
        assert(t.isCoinbase !== true);
        assert(t.height === null);
        assert(t.type === 'recv');
        assert(t.vsize === t.tsize);
        assert(/^[0-9]+$/.test(t.fee) && t.fee !== 0);
    }

    it('one unconfirmed', function () {
        this.timeout(60 * 1000);
        const address = 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q';
        return run('bitcore-regtest-cli sendtoaddress ' + address + ' 1').then(() =>
            promiseTimeout(20 * 1000)
        ).then(() =>
            testDiscovery(discovery, xpub, testUnconf)
        );
    });

    it('one unconfirmed - from empty', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, testUnconf, lastEmpty);
    });

    it('one unconfirmed - from same', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, testUnconf, lastUnconf);
    });

    it('one unconfirmed - from empty - testing orphaned blocks', function () {
        this.timeout(60 * 1000);
        const oldhash = lastEmpty.lastBlock.hash;
        lastEmpty.lastBlock.hash = 'deadbeef';
        const res = testDiscovery(discovery, xpub, testUnconf, lastEmpty);
        res.then(
            () => { lastEmpty.lastBlock.hash = oldhash; },
            () => { lastEmpty.lastBlock.hash = oldhash; }
        );
        return res;
    });

    let lastConf;

    function testConf(info) {
        lastConf = info;
        const btc = 1e8;
        assert(info.utxos.length === 1);
        assert(info.utxos[0].height !== null);
        assert(info.usedAddresses.length === 1);
        assert(info.usedAddresses[0].address === 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q');
        assert(info.usedAddresses[0].received === btc);
        assert(info.changeAddresses.length === 20);
        assert(info.changeAddresses[0] === 'mm6kLYbGEL1tGe4ZA8xacfgRPdW1NLjCbZ');
        assert(info.changeAddresses[1] === 'mjXZwmEi1z1MzveZrKUAo4DBgbdq4sBYT6');
        assert(info.unusedAddresses.length === 20);
        assert(info.unusedAddresses[0] === 'mopZWqZZyQc3F2Sy33cvDtJchSAMsnLi7b');
        assert(info.changeIndex === 0);
        assert(!!info.allowChange);
        assert(info.balance === btc);
        assert(Object.keys(info.sentAddresses).length === 0);
        assert(info.transactions.length === 1);
        const t = info.transactions[0];
        assert(t.isCoinbase !== true);
        assert(t.height !== null);
        assert(t.type === 'recv');
        assert(t.vsize === t.tsize);
        assert(/^[0-9]+$/.test(t.fee) && t.fee !== 0);
    }

    it('one confirmed', function () {
        this.timeout(60 * 1000);
        return run('bitcore-regtest-cli generate 300').then(() =>
            promiseTimeout(20 * 1000)
        ).then(() =>
            testDiscovery(discovery, xpub, testConf)
        );
    });

    it('one confirmed - from empty', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, testConf, lastEmpty);
    });

    it('one confirmed - from unconf', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, testConf, lastUnconf);
    });

    it('one unconfirmed - from same', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, testConf, lastConf);
    });

    it('one confirmed - from unconf - testing orphaned blocks', function () {
        this.timeout(60 * 1000);
        const old = lastUnconf.lastBlock.hash;
        lastUnconf.lastBlock.hash = 'deadbeef';
        const res = testDiscovery(discovery, xpub, testConf, lastUnconf);

        res.then(
            () => { lastUnconf.lastBlock.hash = old; },
            () => { lastUnconf.lastBlock.hash = old; }
        );
        return res;
    });

    it('one confirmed - from unconf - testing version == null', function () {
        this.timeout(60 * 1000);
        lastUnconf.version = null;
        const res = testDiscovery(discovery, xpub, testConf, lastUnconf);

        res.then(
            () => { lastUnconf.version = 1; },
            () => { lastUnconf.version = 1; }
        );
        return res;
    });

    it('builds and sends tx from info', function () {
        this.timeout(60 * 1000);

        function makeTx(inTxId, inTxVout, inTxHdnodeIndex, outs) {
            const hdnode = bitcoin.HDNode.fromBase58(xpub,
                bitcoin.networks.testnet
            ).derive(0);
            const ecpair = hdnode.derive(inTxHdnodeIndex).keyPair;

            const builder = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);

            return blockchain.lookupTransaction(inTxId).then(({hex}) => {
                const transaction = bitcoin.Transaction.fromHex(hex);
                builder.addInput(transaction, inTxVout, 0);
                outs.forEach(({address, value}) => {
                    builder.addOutput(address, value);
                });
                builder.sign(0, ecpair);
                const newTx = builder.buildIncomplete();
                return {
                    hex: newTx.toHex(),
                    id: newTx.getId(),
                };
            });
        }

        const inTxId = lastUnconf.utxos[0].transactionHash;
        const inTxVout = lastUnconf.utxos[0].index;
        const inTxHdnodeIndex = lastUnconf.utxos[0].addressPath[1];
        const outs = [
            {
                address: 'mvGnbHiYbYbpuwBhTHRXfZHjjcmSWKn5nm',
                value: Math.floor(1e8 / 3),
            }, {
                address: lastUnconf.changeAddresses[0],
                value: Math.floor(1e8 / 3),
            },
        ];

        return makeTx(inTxId, inTxVout, inTxHdnodeIndex, outs).then((tx) => {
            return blockchain.sendTransaction(tx.hex);
        });
    });

    let lastSent;

    function testSent(info) {
        lastSent = info;
        const btc = 1e8;
        assert(info.utxos.length === 1);
        assert(info.utxos[0].height === null);
        assert(info.usedAddresses.length === 1);
        assert(info.usedAddresses[0].address === 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q');
        assert(info.usedAddresses[0].received === btc);
        assert(info.changeAddresses.length === 20);
        assert(info.changeAddresses[0] === 'mm6kLYbGEL1tGe4ZA8xacfgRPdW1NLjCbZ');
        assert(info.unusedAddresses.length === 20);
        assert(info.unusedAddresses[0] === 'mopZWqZZyQc3F2Sy33cvDtJchSAMsnLi7b');
        assert(info.changeIndex === 1);
        assert(!!info.allowChange);
        assert(info.balance === Math.floor(btc / 3));
        assert(Object.keys(info.sentAddresses).length === 1);
        assert(info.transactions.length === 2);
        const t = info.transactions[0];
        assert(t.isCoinbase !== true);
        assert(t.height === null);
        assert(t.type === 'sent');
        assert(t.vsize === t.tsize);
        assert(/^[0-9]+$/.test(t.fee) && t.fee !== 0);
    }

    it('sent tx', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, testSent);
    });

    it('sent tx from itself', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, testSent, lastSent);
    });

    function testTwoReceived(info) {
        lastSent = info;
        const btc = 1e8;
        assert(info.utxos.length === 2);
        assert(info.utxos[0].height === null);
        assert(info.usedAddresses.length === 1);
        assert(info.usedAddresses[0].address === 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q');
        assert(info.usedAddresses[0].received === 2 * btc);
        assert(info.changeAddresses.length === 20);
        assert(info.changeAddresses[0] === 'mm6kLYbGEL1tGe4ZA8xacfgRPdW1NLjCbZ');
        assert(info.unusedAddresses.length === 20);
        assert(info.unusedAddresses[0] === 'mopZWqZZyQc3F2Sy33cvDtJchSAMsnLi7b');
        assert(info.changeIndex === 1);
        assert(!!info.allowChange);
        assert(info.balance === Math.floor(btc / 3) + btc);
        assert(Object.keys(info.sentAddresses).length === 1);
        assert(info.transactions.length === 3);
        const t = info.transactions[1];
        assert(t.isCoinbase !== true);
        assert(t.height === null);
        assert(t.type === 'recv');
        assert(t.vsize === t.tsize);
        assert(/^[0-9]+$/.test(t.fee) && t.fee !== 0);
    }

    it('another received', function () {
        this.timeout(60 * 1000);
        const address = 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q';
        return run('bitcore-regtest-cli sendtoaddress ' + address + ' 1').then(() =>
            promiseTimeout(20 * 1000)
        ).then(() =>
            testDiscovery(discovery, xpub, testTwoReceived, lastSent)
        );
    });

    let opreturnId;
    it('builds and sends opreturn tx', function () {
        this.timeout(60 * 1000);

        function makeTx(inTxId, inTxVout, inTxHdnodePath) {
            const hdnode = bitcoin.HDNode.fromBase58(xpub,
                bitcoin.networks.testnet
            );
            const ecpair = hdnode.derivePath(inTxHdnodePath).keyPair;

            const builder = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);

            return blockchain.lookupTransaction(inTxId).then(({hex}) => {
                const transaction = bitcoin.Transaction.fromHex(hex);

                builder.addInput(transaction, inTxVout, 0);

                const data = new Buffer('bitcoinjs-lib');
                const dataScript = bitcoin.script.nullData.output.encode(data);

                builder.addOutput(dataScript, 1000);

                builder.sign(0, ecpair);
                const newTx = builder.buildIncomplete();
                return {
                    hex: newTx.toHex(),
                    id: newTx.getId(),
                };
            });
        }

        const inTxId = lastSent.utxos[0].transactionHash;
        const inTxVout = lastSent.utxos[0].index;
        const inTxHdnodePath = lastSent.utxos[0].addressPath.join('/');

        return makeTx(inTxId, inTxVout, inTxHdnodePath).then((tx) => {
            opreturnId = tx.id;
            return blockchain.sendTransaction(tx.hex);
        });
    });

    let lastTwoRcvSent;
    function testTwoReceivedAndSent(info) {
        lastTwoRcvSent = info;
        const btc = 1e8;
        assert(info.utxos.length === 1);
        assert(info.utxos[0].height === null);
        assert(info.usedAddresses.length === 1);
        assert(info.usedAddresses[0].address === 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q');
        assert(info.usedAddresses[0].received === 2 * btc);
        assert(info.changeAddresses.length === 20);
        assert(info.changeAddresses[0] === 'mm6kLYbGEL1tGe4ZA8xacfgRPdW1NLjCbZ');
        assert(info.unusedAddresses.length === 20);
        assert(info.unusedAddresses[0] === 'mopZWqZZyQc3F2Sy33cvDtJchSAMsnLi7b');
        assert(info.changeIndex === 1);
        assert(!!info.allowChange);
        assert(info.balance === btc);
        assert(Object.keys(info.sentAddresses).length === 2);
        assert(info.transactions.length === 4);
        const t = info.transactions[0];
        assert(t.isCoinbase !== true);
        assert(t.height === null);
        assert(t.type === 'sent');
        assert(t.vsize === t.tsize);
        assert(/^[0-9]+$/.test(t.fee) && t.fee !== 0);
    }

    it('another sent, to op-return', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, testTwoReceivedAndSent);
    });

    it('deletes transactions when not in mempool', function () {
        this.timeout(60 * 1000);

        // mocking deletion of tx in mempool
        blockchain.lookupTransactionOld = blockchain.lookupTransaction;
        blockchain.lookupTransaction = (hash) => {
            if (hash === opreturnId) {
                return Promise.reject('nope');
            } else {
                return blockchain.lookupTransactionOld(hash);
            }
        };

        blockchain.lookupTransactionsStreamOld = blockchain.lookupTransactionsStream;
        blockchain.lookupTransactionsStream = (addresses, start, end) => {
            return blockchain.lookupTransactionsStreamOld(addresses, start, end).map(arr => arr.filter(tx => tx.hash !== opreturnId));
        };

        const res = testDiscovery(discovery, xpub, testTwoReceived, lastTwoRcvSent);
        res.then(
            () => {
                blockchain.lookupTransactionsStream = blockchain.lookupTransactionsStreamOld;
                blockchain.lookupTransaction = blockchain.lookupTransactionOld;
            },
            () => {
                blockchain.lookupTransactionsStream = blockchain.lookupTransactionsStreamOld;
                blockchain.lookupTransaction = blockchain.lookupTransactionOld;
            },
        );
        return res;
    });

    function testTwoReceivedAndSentSelf(info) {
        lastTwoRcvSent = info;
        const btc = 1e8;
        assert(info.utxos.length === 1);
        assert(info.utxos[0].height === null);
        assert(info.usedAddresses.length === 2);
        assert(info.usedAddresses[0].address === 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q');
        assert(info.usedAddresses[0].received === 2 * btc);
        assert(info.usedAddresses[1].received === Math.floor(btc / 2));
        assert(info.changeAddresses.length === 20);
        assert(info.changeAddresses[0] === 'mm6kLYbGEL1tGe4ZA8xacfgRPdW1NLjCbZ');
        assert(info.unusedAddresses.length === 19);
        assert(info.changeIndex === 1);
        assert(!!info.allowChange);
        assert(info.balance === btc / 2);
        assert(Object.keys(info.sentAddresses).length === 2);
        assert(info.transactions.length === 5);
        const t = info.transactions[2];
        assert(t.isCoinbase !== true);
        assert(t.height === null);
        assert(t.type === 'self');
    }

    it('builds and sends to self', function () {
        this.timeout(60 * 1000);

        function makeTx(inTxId, inTxVout, inTxHdnodePath) {
            const hdnode = bitcoin.HDNode.fromBase58(xpub,
                bitcoin.networks.testnet
            );
            const ecpair = hdnode.derivePath(inTxHdnodePath).keyPair;

            const builder = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);

            return blockchain.lookupTransaction(inTxId).then(({hex}) => {
                const transaction = bitcoin.Transaction.fromHex(hex);

                builder.addInput(transaction, inTxVout, 0);

                builder.addOutput('mopZWqZZyQc3F2Sy33cvDtJchSAMsnLi7b', Math.floor(1e8 / 2));

                builder.sign(0, ecpair);
                const newTx = builder.buildIncomplete();
                return {
                    hex: newTx.toHex(),
                    id: newTx.getId(),
                };
            });
        }

        const inTxId = lastTwoRcvSent.utxos[0].transactionHash;
        const inTxVout = lastTwoRcvSent.utxos[0].index;
        const inTxHdnodePath = lastTwoRcvSent.utxos[0].addressPath.join('/');

        return makeTx(inTxId, inTxVout, inTxHdnodePath).then((tx) => {
            return blockchain.sendTransaction(tx.hex);
        });
    });

    it('another sent, to self', function () {
        this.timeout(60 * 1000);
        return testDiscovery(discovery, xpub, testTwoReceivedAndSentSelf);
    });

    it('returns rejected when inconsistent balance', function () {
        this.timeout(60 * 1000);
        const i = (Object.keys(lastConf.transactions[0].myOutputs))[0];
        const old = lastConf.transactions[0].myOutputs[i].value;
        lastConf.transactions[0].myOutputs[i].value = 123;

        const stream = discovery.discoverAccount(
            lastConf,
            xpub,
            bitcoin.networks.testnet,
            'off'
        );
        const res = reversePromise(stream.ending);
        res.then(
            () => { lastConf.transactions[0].myOutputs[i].value = old; },
            () => { lastConf.transactions[0].myOutputs[i].value = old; },
        );
        return res;
    });

    it('returns rejected when (mocked) server down', function () {
        this.timeout(60 * 1000);
        const old = blockchain.lookupTransactionsStream;
        blockchain.lookupTransactionsStream = () => new Stream((update, finish) => {
            setTimeout(() => update(new Error('Error')), 0);
            () => {};
        });
        const stream = discovery.discoverAccount(
            null,
            xpub,
            bitcoin.networks.testnet,
            'off'
        );
        const res = reversePromise(stream.ending);
        res.then(
            () => { blockchain.lookupTransactionsStream = old; },
            () => { blockchain.lookupTransactionsStream = old; }
        );
        return res;
    });

    it('does update on new tx', function (done) {
        this.timeout(60 * 1000);
        const stream = discovery.monitorAccountActivity(
            lastTwoRcvSent,
            xpub,
            bitcoin.networks.testnet,
            'off'
        );
        testStream(
            stream,
            (accountInfo) => {
                assert(accountInfo.transactions instanceof Array);
            },
            19 * 1000,
            done
        );
        const address = 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q';
        const bashstr = 'bitcore-regtest-cli sendtoaddress ' + address + ' 1';
        promiseTimeout(2 * 1000).then(() => run(bashstr));
    });

    it('does update on new block', function (done) {
        this.timeout(60 * 1000);
        const stream = discovery.monitorAccountActivity(
            lastTwoRcvSent,
            xpub,
            bitcoin.networks.testnet,
            'off'
        );
        testStream(
            stream,
            (accountInfo) => {
                lastTwoRcvSent = accountInfo;
                assert(accountInfo.transactions instanceof Array);
            },
            19 * 1000,
            done
        );
        promiseTimeout(2 * 1000).then(() => run('bitcore-regtest-cli generate 1'));
    });

    it('does not update on block when there is no unconf', function (done) {
        this.timeout(60 * 1000);
        const stream = discovery.monitorAccountActivity(
            lastTwoRcvSent,
            xpub,
            bitcoin.networks.testnet,
            'off'
        );
        let isdone = false;
        stream.values.attach((value, detach) => {
            isdone = true;
            done(new Error('Should not update.'));
        });

        const bashstr = 'bitcore-regtest-cli generate 1';
        promiseTimeout(2 * 1000)
            .then(() => run(bashstr))
            .then(() => promiseTimeout(15 * 1000))
            .then(() => {
                stream.values.destroy();
                if (!isdone) {
                    done();
                }
            });
    });

    it('returns rejected on nonsensic xpub', function () {
        this.timeout(60 * 1000);
        const xpub2 = 'thisisnotxpub';
        const stream = discovery.discoverAccount(
            null,
            xpub2,
            bitcoin.networks.testnet,
            'off'
        );
        return reversePromise(stream.ending);
    });

    it('does update with error on nonsensic xpub', function (done) {
        this.timeout(60 * 1000);

        const stream = discovery.monitorAccountActivity(
            lastTwoRcvSent,
            'thisisnotxpub',
            bitcoin.networks.testnet,
            'off'
        );
        testStream(
            stream,
            (accountInfo) => assert(accountInfo instanceof Error),
            19 * 1000,
            done
        );
    });

    it('returns rejected when server down', function () {
        this.timeout(60 * 1000);
        return stopBitcore().then(() => {
            const stream = discovery.discoverAccount(
                null,
                xpub,
                bitcoin.networks.testnet,
                'off'
            );
            return reversePromise(stream.ending);
        });
    });
});
