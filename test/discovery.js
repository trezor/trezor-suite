/* global it:false, describe:false */

import assert from 'assert';
import bitcoin from 'bitcoinjs-lib-zcash';

import {startBitcore} from '../test_helpers/common.js';
import {run} from '../test_helpers/_node_client.js';
import {WorkerChannel} from '../lib/utils/simple-worker-channel';
import {BitcoreBlockchain} from '../lib/bitcore';
import {WorkerDiscovery} from '../lib/discovery/worker-discovery';

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

function testDiscovery(discovery, done, xpub, testfun, last) {
    const stream = discovery.discoverAccount(
        last,
        xpub,
        bitcoin.networks.testnet,
        'off'
    );
    stream.ending.then((res) => {
        try {
            if (!(/^[0-9]+$/.test(res.lastBlock.height))) {
                done(new Error('block not number'));
            }
            if (!(/^[0-9a-f]+$/.test(res.lastBlock.hash))) {
                done(new Error('block not hexa'));
            }

            if (testfun(res)) {
                done();
            } else {
                done(new Error('Test not satisfied.'));
            }
        } catch (e) {
            done(e);
        }
    }, (e) => done(e));
}

describe('discovery', () => {
    describe('constructor', () => {
        let discovery;

        it('starts bitcore', function () {
            this.timeout(60 * 1000);
            return startBitcore().then(() => {
                return run('bitcore-regtest-cli generate 300');
            });
        });

        it('creates something', () => {
            const blockchain = new BitcoreBlockchain(['http://localhost:3005'], socketWorkerFactory);
            discovery = new WorkerDiscovery(discoveryWorkerFactory, addressChannel, blockchain);
            assert.ok(discovery);
        });

        it('does some discovery', function (done) {
            this.timeout(60 * 1000);
            const xpub = 'tprv8hfY7uEoozgCAdFuTmhxnzM5fxDqoNe1AkeMCiKJ3NqJVzi6d5vQJhPsLdTnenmKNMobAM5Znrm3LEswj7GV1mBGm28DH4zVfcvBkYbTGqR';
            testDiscovery(discovery, done, xpub, () => true);
        });

        let lastEmpty;
        function testEmpty(info) {
            lastEmpty = info;
            if (info.utxos.length !== 0) {
                return false;
            }
            if (info.usedAddresses.length !== 0) {
                return false;
            }
            if (info.changeAddresses.length !== 20) {
                return false;
            }
            if (info.changeAddresses[0] !== 'mm6kLYbGEL1tGe4ZA8xacfgRPdW1NLjCbZ') {
                return false;
            }
            if (info.changeAddresses[1] !== 'mjXZwmEi1z1MzveZrKUAo4DBgbdq4sBYT6') {
                return false;
            }
            if (info.unusedAddresses.length !== 20) {
                return false;
            }
            if (info.unusedAddresses[0] !== 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q') {
                return false;
            }
            if (info.unusedAddresses[1] !== 'mopZWqZZyQc3F2Sy33cvDtJchSAMsnLi7b') {
                return false;
            }
            if (info.changeIndex !== 0) {
                return false;
            }
            if (!info.allowChange) {
                return false;
            }
            if (info.balance !== 0) {
                return false;
            }
            if (Object.keys(info.sentAddresses).length !== 0) {
                return false;
            }
            if (info.transactions.length !== 0) {
                return false;
            }

            return true;
        }

        it('returns empty on empty account', function (done) {
            this.timeout(60 * 1000);
            const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';
            testDiscovery(discovery, done, xpub, testEmpty);
        });

        it('continuing empty is still empty', function (done) {
            this.timeout(60 * 1000);
            const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';
            testDiscovery(discovery, done, xpub, testEmpty, lastEmpty);
        });

        let lastUnconf;

        function testUnconf(info) {
            lastUnconf = info;
            const btc = 1e8;
            if (info.utxos.length !== 1) {
                return false;
            }
            if (info.utxos[0].height !== null) {
                return false;
            }
            if (info.usedAddresses.length !== 1) {
                return false;
            }
            if (info.usedAddresses[0].address !== 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q') {
                return false;
            }
            if (info.usedAddresses[0].received !== btc) {
                return false;
            }

            if (info.changeAddresses.length !== 20) {
                return false;
            }
            if (info.changeAddresses[0] !== 'mm6kLYbGEL1tGe4ZA8xacfgRPdW1NLjCbZ') {
                return false;
            }
            if (info.changeAddresses[1] !== 'mjXZwmEi1z1MzveZrKUAo4DBgbdq4sBYT6') {
                return false;
            }
            if (info.unusedAddresses.length !== 19) {
                return false;
            }
            if (info.unusedAddresses[0] !== 'mopZWqZZyQc3F2Sy33cvDtJchSAMsnLi7b') {
                return false;
            }
            if (info.changeIndex !== 0) {
                return false;
            }
            if (!info.allowChange) {
                return false;
            }
            if (info.balance !== btc) {
                return false;
            }
            if (Object.keys(info.sentAddresses).length !== 0) {
                return false;
            }
            if (info.transactions.length !== 1) {
                return false;
            }
            const t = info.transactions[0];
            if (t.isCoinbase === true) {
                return false;
            }
            if (t.height !== null) {
                return false;
            }
            if (t.type !== 'recv') {
                return false;
            }
            return true;
        }

        it('one unconfirmed', function (done) {
            this.timeout(60 * 1000);
            const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';
            const address = 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q';
            run('bitcore-regtest-cli sendtoaddress ' + address + ' 1').then((response) => {
                setTimeout(() =>
                    testDiscovery(discovery, done, xpub, testUnconf)
                , 20 * 1000);
            });
        });

        it('one unconfirmed - from empty', function (done) {
            this.timeout(60 * 1000);
            const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';
            testDiscovery(discovery, done, xpub, testUnconf, lastEmpty);
        });

        it('one unconfirmed - from same', function (done) {
            this.timeout(60 * 1000);
            const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';
            testDiscovery(discovery, done, xpub, testUnconf, lastUnconf);
        });

        it('one unconfirmed - from empty - testing orphaned blocks', function (done) {
            this.timeout(60 * 1000);
            const oldhash = lastEmpty.lastBlock.hash;
            lastEmpty.lastBlock.hash = 'deadbeef';
            const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';
            testDiscovery(discovery, done, xpub, testUnconf, lastEmpty);
            lastEmpty.lastBlock.hash = oldhash;
        });

        let lastConf;

        function testConf(info) {
            lastConf = info;
            const btc = 1e8;
            if (info.utxos.length !== 1) {
                return false;
            }
            if (info.utxos[0].height === null) {
                return false;
            }
            if (info.usedAddresses.length !== 1) {
                return false;
            }
            if (info.usedAddresses[0].address !== 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q') {
                return false;
            }
            if (info.usedAddresses[0].received !== btc) {
                return false;
            }

            if (info.changeAddresses.length !== 20) {
                return false;
            }
            if (info.changeAddresses[0] !== 'mm6kLYbGEL1tGe4ZA8xacfgRPdW1NLjCbZ') {
                return false;
            }
            if (info.changeAddresses[1] !== 'mjXZwmEi1z1MzveZrKUAo4DBgbdq4sBYT6') {
                return false;
            }
            if (info.unusedAddresses.length !== 20) {
                return false;
            }
            if (info.unusedAddresses[0] !== 'mopZWqZZyQc3F2Sy33cvDtJchSAMsnLi7b') {
                return false;
            }
            if (info.changeIndex !== 0) {
                return false;
            }
            if (!info.allowChange) {
                return false;
            }
            if (info.balance !== btc) {
                return false;
            }
            if (Object.keys(info.sentAddresses).length !== 0) {
                return false;
            }
            if (info.transactions.length !== 1) {
                return false;
            }
            const t = info.transactions[0];
            if (t.isCoinbase === true) {
                return false;
            }
            if (t.height === null) {
                return false;
            }
            if (t.type !== 'recv') {
                return false;
            }
            return true;
        }

        it('one confirmed', function (done) {
            this.timeout(60 * 1000);
            const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';
            run('bitcore-regtest-cli generate 300').then((response) => {
                setTimeout(() =>
                    testDiscovery(discovery, done, xpub, testConf)
                , 20 * 1000);
            });
        });

        it('one confirmed - from empty', function (done) {
            this.timeout(60 * 1000);
            const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';
            testDiscovery(discovery, done, xpub, testConf, lastEmpty);
        });

        it('one confirmed - from unconf', function (done) {
            this.timeout(60 * 1000);
            const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';
            testDiscovery(discovery, done, xpub, testConf, lastUnconf);
        });

        it('one unconfirmed - from same', function (done) {
            this.timeout(60 * 1000);
            const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';
            testDiscovery(discovery, done, xpub, testConf, lastConf);
        });

        it('one confirmed - from unconf - testing orphaned blocks', function (done) {
            this.timeout(60 * 1000);
            const xpub = 'tprv8gdjtqr3TjNXgxpdi4LurDeG1Z8rQR2cGXYbaifKAPypiaF8hG5k5XxT7bTsjdkN9ERUkLVb47tvJ7sYRsJrkbbFf2UTRqAkkGRcaWEhRuY';
            lastUnconf.lastBlock.hash = 'deadbeef';
            testDiscovery(discovery, done, xpub, testConf, lastUnconf);
        });
    });
});
