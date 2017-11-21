'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WorkerDiscovery = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stream = require('../utils/stream');

var _outside = require('./worker/outside');

var _bitcoinjsLibZcash = require('bitcoinjs-lib-zcash');

var _simpleWorkerChannel = require('../utils/simple-worker-channel');

var _addressSource = require('../address-source');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WorkerDiscovery = exports.WorkerDiscovery = function () {
    function WorkerDiscovery(discoveryWorkerFactory, fastXpubWorker, fastXpubWasmPromise, chain) {
        var _this = this;

        _classCallCheck(this, WorkerDiscovery);

        this.forceAddedTransactions = [];
        this.forceAddedTransactionsEmitter = new _stream.Emitter();
        this.forceAddedTransactionsStream = _stream.Stream.fromEmitter(this.forceAddedTransactionsEmitter, function () {}).map(function () {
            return 'block';
        });

        this.discoveryWorkerFactory = discoveryWorkerFactory;
        // $FlowIssue
        this.addressWorkerChannel = typeof WebAssembly === 'undefined' ? null : new _simpleWorkerChannel.WorkerChannel(fastXpubWorker);
        fastXpubWasmPromise.then(function (binary) {
            if (_this.addressWorkerChannel !== null) {
                fastXpubWorker.postMessage({ type: 'init', binary: binary });
            }
        }, function (error) {
            return console.error(error);
        });
        this.chain = chain;
    }

    _createClass(WorkerDiscovery, [{
        key: 'tryHDNode',
        value: function tryHDNode(xpub, network) {
            try {
                var node = _bitcoinjsLibZcash.HDNode.fromBase58(xpub, network, true);
                return node;
            } catch (e) {
                return e;
            }
        }
    }, {
        key: 'forceAddTransaction',


        // useful for adding transactions right after succesful send
        value: function forceAddTransaction(transaction) {
            this.forceAddedTransactions.push(transaction);
            this.forceAddedTransactionsEmitter.emit(true);
        }
    }, {
        key: 'discoverAccount',
        value: function discoverAccount(initial, xpub, network, segwit) {
            var node = this.tryHDNode(xpub, network);
            if (node instanceof Error) {
                return _stream.StreamWithEnding.fromStreamAndPromise(_stream.Stream.fromArray([]), Promise.reject(node));
            }
            var external = node.derive(0);
            var internal = node.derive(1);

            var sources = [this.createAddressSource(external, network, segwit), this.createAddressSource(internal, network, segwit)];

            var out = new _outside.WorkerDiscoveryHandler(this.discoveryWorkerFactory, this.chain, sources, network, this.forceAddedTransactions);
            return out.discovery(initial, xpub, segwit === 'p2sh');
        }
    }, {
        key: 'monitorAccountActivity',
        value: function monitorAccountActivity(initial, xpub, network, segwit) {
            var _this2 = this;

            var node = this.tryHDNode(xpub, network);
            if (node instanceof Error) {
                return _stream.Stream.simple(node);
            }
            var external = node.derive(0);
            var internal = node.derive(1);

            var sources = [this.createAddressSource(external, network, segwit), this.createAddressSource(internal, network, segwit)];

            function allAddresses(info) {
                return new Set(info.usedAddresses.map(function (a) {
                    return a.address;
                }).concat(info.unusedAddresses).concat(info.changeAddresses));
            }

            this.chain.subscribe(allAddresses(initial));
            var currentState = initial;

            var txNotifs = this.chain.notifications.filter(function (tx) {
                // determine if it's mine
                var addresses = allAddresses(currentState);
                var mine = false;
                tx.inputAddresses.concat(tx.outputAddresses).forEach(function (a) {
                    if (a != null) {
                        if (addresses.has(a)) {
                            mine = true;
                        }
                    }
                });
                return mine;
            })
            // flow thing
            .map(function (tx) {
                return tx;
            });

            // we need to do updates on blocks, if there are unconfs
            var blockStream = this.chain.blocks.map(function () {
                return 'block';
            });

            var resNull = blockStream.concat(txNotifs).concat(this.forceAddedTransactionsStream).mapPromiseError(function () {
                var out = new _outside.WorkerDiscoveryHandler(_this2.discoveryWorkerFactory, _this2.chain, sources, network, _this2.forceAddedTransactions);
                return out.discovery(currentState, xpub, segwit === 'p2sh').ending.then(function (res) {
                    currentState = res;
                    return res;
                });
            });

            var res = _stream.Stream.filterNull(resNull);
            return res;
        }
    }, {
        key: 'createAddressSource',
        value: function createAddressSource(node, network, segwit) {
            var addressWorkerChannel = this.addressWorkerChannel;
            if (addressWorkerChannel == null) {
                return null;
            }
            var version = segwit === 'p2sh' ? network.scriptHash : network.pubKeyHash;
            return new _addressSource.WorkerAddressSource(addressWorkerChannel, node, version, segwit);
        }
    }]);

    return WorkerDiscovery;
}();