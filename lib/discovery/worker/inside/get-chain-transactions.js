'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GetChainTransactions = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

// This is what happens INSIDE the worker
// We ask the MAIN to fetch us transactions from the
// blockchain and addresses
// The MAIN thread replies back to the worker, and we work from there
//
//
// It's complicated like this, because
// (1) we want to keep the logic in the worker
// (2) but the worker cannot directly call another worker, and we have all
//      other logic in separate workers for speed purposes
//          we have bitcore socket.io communication in worker, because the http polling is slow
//          we have the address derivation in worker, because it's slow
//  so we have the logic of asking things out from the worker by requests,
//  and the main thread returning things back

exports.findDeleted = findDeleted;

var _deferred = require('../../../utils/deferred');

var _stream = require('../../../utils/stream');

var _bitcoinjsLibZcash = require('bitcoinjs-lib-zcash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GAP_SIZE = 20;

var GetChainTransactions = exports.GetChainTransactions = function () {
    _createClass(GetChainTransactions, [{
        key: 'originalLastSearched',


        // last address that was searched with the previous search


        // a variable that will maybe increase when I see
        // new confirmed address


        // transactions in the range will be saved to this array
        // indexed by hash
        value: function originalLastSearched() {
            return this.originalLastConfirmed + GAP_SIZE;
        }

        // this is deferred promise for result


        // last address that was confirmed with the previous search
        // (constant)


        // path of last address that I searched


        // address -> number map

        // all seen addresses, including the gap addresses

    }, {
        key: 'nullRange',
        value: function nullRange() {
            var range = this.range;
            return _extends({}, range, {
                since: range.nullBlock
            });
        }

        // will be injected

    }]);

    function GetChainTransactions(id, range, originalLastConfirmed, getStream, originalTransactions, oldAddresses, network, xpub, segwit, webassembly) {
        _classCallCheck(this, GetChainTransactions);

        this.allCheckedAddresses = [];
        this.backSearch = {};
        this.newTransactions = {};
        this.lastSearched = -1;
        this.dfd = (0, _deferred.deferred)();

        this.originalLastConfirmed = originalLastConfirmed;
        this.lastConfirmed = originalLastConfirmed;
        this.chainId = id;
        this.range = range;
        this.getStream = getStream;
        this.txids = deriveTxidSet(originalTransactions);
        this.allAddresses = oldAddresses;
        this.network = network;
        this.xpub = xpub;
        this.segwit = segwit;
        this.webassembly = webassembly;
    }

    _createClass(GetChainTransactions, [{
        key: 'discover',
        value: function discover() {
            // first and last range of addresses for the first search
            // (always 0 - 19)
            var first = 0;
            var last = GAP_SIZE - 1;

            this.iterate(first, last, this.range);
            return this.dfd.promise;
        }

        // one "iteration" - meaning, get stream of transactions on one chunk,
        // wait for it to end, and then decide what to do next

    }, {
        key: 'iterate',
        value: function iterate(first, last, // last is inclusive
        range) {
            var _this = this;

            var addresses = null;
            if (this.allAddresses.length - 1 >= last) {
                addresses = this.allAddresses.slice(first, last + 1);
            } else {
                if (!this.webassembly) {
                    addresses = [];
                    // if webassembly is off => we generate everything here
                    var chainNode = _bitcoinjsLibZcash.HDNode.fromBase58(this.xpub, this.network).derive(this.chainId);
                    for (var i = first; i <= last; i++) {
                        var addressNode = chainNode.derive(i);
                        var _address = '';

                        if (!this.segwit) {
                            _address = addressNode.getAddress();
                        } else {
                            // see https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki
                            // address derivation + test vectors
                            var pkh = addressNode.getIdentifier();
                            var scriptSig = new Buffer(pkh.length + 2);
                            scriptSig[0] = 0;
                            scriptSig[1] = 0x14;
                            pkh.copy(scriptSig, 2);
                            var addressBytes = _bitcoinjsLibZcash.crypto.hash160(scriptSig);
                            _address = _bitcoinjsLibZcash.address.toBase58Check(addressBytes, this.network.scriptHash);
                        }

                        addresses[i - first] = _address;
                    }
                }
            }

            var stream = this.getStream(this.chainId, first, last, range.first.height, range.last.height, this.txids.size, addresses);

            stream.values.attach(function (value_) {
                if (value_ instanceof Error) {
                    _this.dfd.reject(value_);
                    stream.dispose();
                    return;
                }

                var value = value_;
                _this.handleTransactions(value, first);
            });

            stream.finish.attach(function () {
                _this.handleFinish(last);
            });
        }

        // What to do with transactions?

    }, {
        key: 'handleTransactions',
        value: function handleTransactions(value, first) {
            var _this2 = this;

            // save the addresses
            value.addresses.forEach(function (address, i) {
                _this2.allAddresses[i + first] = address;
                _this2.allCheckedAddresses[i + first] = address;
                _this2.backSearch[address] = i + first;
            });

            value.transactions.forEach(function (transaction) {
                // parse txs (error in here is handled in iterate)
                var parsed = _bitcoinjsLibZcash.Transaction.fromHex(transaction.hex, transaction.zcash);
                var outputAddresses = [];
                parsed.outs.forEach(function (output) {
                    var address = void 0;
                    // try-catch, because some outputs don't have addresses
                    try {
                        address = _bitcoinjsLibZcash.address.fromOutputScript(output.script, _this2.network);
                        // if mine...
                        if (_this2.backSearch[address] != null) {
                            // check if confirmed
                            if (transaction.height != null) {
                                var _addressI = _this2.backSearch[address];
                                // if it's mine and confirmed, bump lastConfirmed
                                if (_addressI > _this2.lastConfirmed) {
                                    _this2.lastConfirmed = _addressI;
                                }
                            }
                        }
                    } catch (e) {
                        // TODO add to flowdef
                        // $FlowIssue
                        var type = _bitcoinjsLibZcash.script.classifyOutput(output.script);

                        if (type === 'nulldata') {
                            // TODO add to flowdef
                            // $FlowIssue
                            var buffer = _bitcoinjsLibZcash.script.nullData.output.decode(output.script);

                            var text = '';

                            if (buffer !== 0) {
                                if (buffer.every(function (i) {
                                    return i >= 32 && i <= 126;
                                })) {
                                    var ascii = buffer.toString('ascii');
                                    text = ascii.slice(0, 40);
                                } else {
                                    var hex = '0x' + buffer.toString('hex');
                                    text = hex.slice(0, 40);
                                }
                            }
                            address = 'OP_RETURN (' + text + ')';
                        } else {
                            address = 'UNKNOWN';
                        }
                    }

                    outputAddresses.push(address);
                });
                var c = {
                    tx: parsed,
                    outputAddresses: outputAddresses,
                    height: transaction.height,
                    timestamp: transaction.timestamp,
                    hash: transaction.hash,
                    fee: transaction.fee,
                    vsize: transaction.vsize,
                    inputAddresses: transaction.inputAddresses
                };

                // more transactions with the same ID overwrite each other
                _this2.newTransactions[c.hash] = c;
                _this2.txids.add(c.hash);
            });
        }

        // when stream finishes, we have to decide if we want try more addresses or not

    }, {
        key: 'handleFinish',
        value: function handleFinish(last) {
            this.lastSearched = last;

            // look at which is the next thing we want
            var shouldSearchLast = this.lastConfirmed + GAP_SIZE;
            var nextChunkEnd = this.lastSearched + GAP_SIZE;
            var nextLast = shouldSearchLast < nextChunkEnd ? shouldSearchLast : nextChunkEnd;
            var nextFirst = this.lastSearched + 1;

            // Is there something to search?
            if (nextLast >= nextFirst) {
                // on completely new addresses, we look from block 0
                // so we don't miss transactions

                // are there some new addresses?
                if (nextLast > this.originalLastSearched()) {
                    // "break" into two parts, one part only new addresses,
                    // other part only old addresses
                    if (nextFirst >= this.originalLastSearched() + 1) {
                        // new addresses, all blocks
                        this.iterate(nextFirst, nextLast, this.nullRange());
                    } else {
                        // old addresses, new blocks
                        this.iterate(nextFirst, this.originalLastSearched(), this.range);
                    }
                } else {
                    // old addresses, new blocks
                    this.iterate(nextFirst, nextLast, this.range);
                }
            } else {
                // nothing more to look for, return
                this.dfd.resolve({
                    newTransactions: this.newTransactions,
                    allAddresses: this.allAddresses
                });
            }
        }
    }]);

    return GetChainTransactions;
}();

function findDeleted(txids, doesTransactionExist) {
    var result = [];
    var str = _stream.Stream.fromArray(txids);
    return str.mapPromiseError(function (id) {
        return doesTransactionExist(id).then(function (exists) {
            if (!exists) {
                result.push(id);
            }
        });
    }).awaitFinish().then(function () {
        return result;
    });
}

function deriveTxidSet(transactions) {
    var res = new Set();

    transactions.forEach(function (t) {
        res.add(t.hash);
    });
    return res;
}