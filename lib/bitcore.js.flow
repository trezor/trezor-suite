'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BitcoreBlockchain = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Interface to bitcore-node blockchain backend
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

require('whatwg-fetch');

var _stream = require('./utils/stream');

var _outside = require('./socketio-worker/outside');

var _deferred = require('./utils/deferred');

var _uniqueRandom = require('./utils/unique-random');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Types beginning with Bc - bitcore format
var BitcoreBlockchain = exports.BitcoreBlockchain = function () {
    _createClass(BitcoreBlockchain, null, [{
        key: '_tryEndpoint',
        // don't show errors; on testing

        // socket errors
        value: function _tryEndpoint(endpoints, socketWorkerFactory, tried) {
            var untriedEndpoints = endpoints.filter(function (e, i) {
                return !tried[i.toString()];
            });

            if (untriedEndpoints.length === 0) {
                return Promise.reject(new Error('All backends are down.'));
            }

            var random = (0, _uniqueRandom.uniqueRandom)(untriedEndpoints.length);
            return onlineStatusCheck(socketWorkerFactory, untriedEndpoints[random]).then(function (socket) {
                if (socket) {
                    return { socket: socket, url: untriedEndpoints[random] };
                } else {
                    tried[random.toString()] = true;
                    return BitcoreBlockchain._tryEndpoint(endpoints, socketWorkerFactory, tried);
                }
            });
        } // does server support estimatesmartfee

        // subscribed addresses
        // activity on subscribed addresses

    }]);

    function BitcoreBlockchain(endpoints, socketWorkerFactory) {
        var _this = this;

        _classCallCheck(this, BitcoreBlockchain);

        this.socket = (0, _deferred.deferred)();
        this.workingUrl = 'none';
        this._silent = false;

        this.addresses = new Set();

        this.socketWorkerFactory = socketWorkerFactory;
        this.endpoints = endpoints;
        this.zcash = false;

        var lookupTM = function lookupTM(socket) {
            return socket.observe('bitcoind/addresstxid').mapPromise(function (_ref) {
                var txid = _ref.txid;
                return _this.lookupTransaction(txid);
            });
        };
        var observeBlocks = function observeBlocks(socket) {
            socket.subscribe('bitcoind/hashblock');
            return socket.observe('bitcoind/hashblock');
        };

        var errors = _stream.Stream.setLater();
        var notifications = _stream.Stream.setLater();
        var blocks = _stream.Stream.setLater();
        this.errors = errors.stream;
        this.notifications = notifications.stream;
        this.blocks = blocks.stream;

        var tried = { '-1': true };
        BitcoreBlockchain._tryEndpoint(endpoints, socketWorkerFactory, tried).then(function (_ref2) {
            var socket = _ref2.socket,
                url = _ref2.url;

            var trySmartFee = estimateSmartTxFee(socket, 2, false).then(function () {
                _this.hasSmartTxFees = true;
            }, function () {
                _this.hasSmartTxFees = false;
            });
            trySmartFee.then(function () {
                _this.workingUrl = url;
                _this.socket.resolve(socket);
                errors.setter(observeErrors(socket));
                notifications.setter(lookupTM(socket));
                blocks.setter(observeBlocks(socket));
            });
        }, function () {
            errors.setter(_stream.Stream.simple(new Error('All backends are offline.')));
            if (!_this._silent) {
                _this.socket.reject(new Error('All backends are offline.'));
                _this.socket.promise.catch(function (e) {
                    return console.error(e);
                });
            }
        });
    }

    // this creates ANOTHER socket!
    // this is for repeated checks after one failure


    _createClass(BitcoreBlockchain, [{
        key: 'hardStatusCheck',
        value: function hardStatusCheck() {
            var _this2 = this;

            return Promise.all(this.endpoints.map(function (endpoint) {
                return onlineStatusCheck(_this2.socketWorkerFactory, endpoint);
            })).then(function (statuschecks) {
                statuschecks.forEach(function (s) {
                    if (s != null) {
                        s.close();
                    }
                });
                var on = statuschecks.filter(function (i) {
                    return i != null;
                });
                return on.length > 0;
            });
        }
    }, {
        key: 'subscribe',
        value: function subscribe(inAddresses) {
            var _this3 = this;

            if (!(inAddresses instanceof Set)) {
                throw new Error('Input not a set of strings.');
            }
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = inAddresses[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _address = _step.value;

                    if (typeof _address !== 'string') {
                        throw new Error('Input not a set of strings.');
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            this.socket.promise.then(function (socket) {
                var newAddresses = [].concat(_toConsumableArray(inAddresses)).filter(function (a) {
                    return !_this3.addresses.has(a);
                });
                newAddresses.forEach(function (a) {
                    return _this3.addresses.add(a);
                });
                if (newAddresses.length !== 0) {
                    for (var i = 0; i < newAddresses.length; i += 20) {
                        socket.subscribe('bitcoind/addresstxid', newAddresses.slice(i, i + 20));
                    }
                }
            }, function () {});
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.socket.promise.then(function (socket) {
                socket.close();
            });
        }

        // start/end are the block numbers, inclusive.
        // start is BIGGER than end
        // anti-intuitive, but the same as bitcore API

    }, {
        key: 'lookupTransactionsStream',
        value: function lookupTransactionsStream(addresses, start, end) {
            var _this4 = this;

            var res = _stream.Stream.fromPromise(this.socket.promise.then(function (socket) {
                return lookupAllAddressHistories(socket, addresses, start, end).map(function (r) {
                    if (r instanceof Error) {
                        return r;
                    }
                    return r.items.map(function (item) {
                        return convertTx(_this4.zcash, item.tx);
                    });
                });
            }));
            return res;
        }

        // start/end are the block numbers, inclusive.
        // start is BIGGER than end
        // anti-intuitive, but the same as bitcore API

    }, {
        key: 'lookupTransactions',
        value: function lookupTransactions(addresses, start, end) {
            var maybeRes = this.lookupTransactionsStream(addresses, start, end).reduce(function (previous, current) {
                if (previous instanceof Error) {
                    return previous;
                }
                if (current instanceof Error) {
                    return current;
                }
                return previous.concat(current);
            }, []);
            return maybeRes.then(function (maybeArray) {
                if (maybeArray instanceof Error) {
                    throw maybeArray;
                }
                return maybeArray;
            });
        }
    }, {
        key: 'lookupTransaction',
        value: function lookupTransaction(hash) {
            var _this5 = this;

            return this.socket.promise.then(function (socket) {
                return lookupDetailedTransaction(socket, hash).then(function (info) {
                    return convertTx(_this5.zcash, info);
                });
            });
        }
    }, {
        key: 'sendTransaction',
        value: function sendTransaction(hex) {
            return this.socket.promise.then(function (socket) {
                return _sendTransaction(socket, hex);
            });
        }
    }, {
        key: 'lookupBlockHash',
        value: function lookupBlockHash(height) {
            return this.socket.promise.then(function (socket) {
                return _lookupBlockHash(socket, height);
            });
        }
    }, {
        key: 'lookupSyncStatus',
        value: function lookupSyncStatus() {
            return this.socket.promise.then(function (socket) {
                return _lookupSyncStatus(socket);
            });
        }
    }, {
        key: 'estimateSmartTxFees',
        value: function estimateSmartTxFees(blocks, conservative) {
            var _this6 = this;

            return this.socket.promise.then(function (socket) {
                var res = Promise.resolve({});
                blocks.forEach(function (block) {
                    res = res.then(function (previous) {
                        var feePromise = _this6.hasSmartTxFees ? estimateSmartTxFee(socket, block, conservative) : Promise.resolve(-1);
                        return feePromise.then(function (fee) {
                            previous[block] = fee;
                            return previous;
                        });
                    });
                });
                return res;
            });
        }
    }, {
        key: 'estimateTxFees',
        value: function estimateTxFees(blocks, skipMissing) {
            return this.socket.promise.then(function (socket) {
                var res = Promise.resolve({});
                blocks.forEach(function (block) {
                    res = res.then(function (previous) {
                        return estimateTxFee(socket, block).then(function (fee) {
                            var add = skipMissing ? fee !== -1 : true;
                            if (add) {
                                previous[block] = fee;
                            }
                            return previous;
                        });
                    });
                });
                return res;
            });
        }
    }]);

    return BitcoreBlockchain;
}();

function lookupAllAddressHistories(socket, addresses, start, end) {
    return _stream.Stream.combineFlat([lookupAddressHistoriesMempool(socket, addresses, true, start, end), lookupAddressHistoriesMempool(socket, addresses, false, start, end)]);
}

function lookupAddressHistoriesMempool(socket, addresses, mempool, start, end) {
    var initial = {
        from: 0,
        to: 0,
        items: [],
        totalCount: 0
    };

    function _flow_typehack(x) {
        // $FlowIssue
        return x;
    }

    var pageLength = 1;
    var first = true;

    return _stream.Stream.generate(initial, function (previous_) {
        var previous = _flow_typehack(previous_);

        // increasing the page size * 5, but only if the txs are small enough
        // (some users like to have giant transactions,
        // which causes trouble on both network and memory)
        //
        // * 5 is quite aggressive, but in reality, the transactions are either
        // all normal, <500 B (so 5 transactions is probably even maybe too cautious),
        // or are all giant (> 20 kB) so taking by 1 is the best
        var previousTxLength = previous.items.reduce(function (total, history) {
            return total + history.tx.hex.length / 2;
        }, 0);

        if (previousTxLength <= 5000 && !first) {
            pageLength = pageLength * 5;
            pageLength = Math.min(50, pageLength);
        }

        first = false;

        var from = previous.to;
        var to = previous.to + pageLength;

        return lookupAddressHistories(socket, addresses, from, to, mempool, start, end).then(function (result) {
            return _extends({}, result, {
                from: from,
                to: to
            });
        }, function (error) {
            if ((typeof error === 'undefined' ? 'undefined' : _typeof(error)) === 'object' && error != null && error instanceof Error) {
                return error;
            } else {
                return new Error(JSON.stringify(error));
            }
        });
    }, function (state) {
        if (state instanceof Error) {
            return false;
        }
        return state.to < state.totalCount;
    });
}

function lookupAddressHistories(socket, addresses, from, // pagination from index (inclusive)
to, // pagination to index (not inclusive)
mempool, start, // recent block height (inclusive)
end // older block height (inclusive)
) {
    var method = 'getAddressHistory';
    var rangeParam = mempool ? {
        start: start, // needed for older bitcores (so we don't load all history if bitcore-node < 3.1.3)
        end: end,
        queryMempoolOnly: true
    } : {
        start: start,
        end: end,
        queryMempol: false
    };
    var params = [addresses, _extends({}, rangeParam, {
        from: from,
        to: to
    })];
    return socket.send({ method: method, params: params });
}

// https://github.com/bitpay/bitcore-node/issues/423
function lookupDetailedTransaction(socket, hash) {
    var method = 'getDetailedTransaction';
    var params = [hash];
    return socket.send({ method: method, params: params });
}

function _sendTransaction(socket, hex) {
    var method = 'sendTransaction';
    var params = [hex];
    return socket.send({ method: method, params: params });
}

function _lookupBlockHash(socket, height) {
    var method = 'getBlockHeader';
    var params = [height];
    return socket.send({ method: method, params: params }).then(function (res) {
        return res.hash;
    });
}

function _lookupSyncStatus(socket) {
    var method = 'getInfo';
    var params = [];
    return socket.send({ method: method, params: params }).then(function (res) {
        return { height: res.blocks };
    });
}

function estimateSmartTxFee(socket, blocks, conservative) {
    var method = 'estimateSmartFee';
    var params = [blocks, conservative];
    return socket.send({ method: method, params: params });
}

function estimateTxFee(socket, blocks) {
    var method = 'estimateFee';
    var params = [blocks];
    return socket.send({ method: method, params: params });
}

function onlineStatusCheck(socketWorkerFactory, endpoint) {
    var socket = new _outside.Socket(socketWorkerFactory, endpoint);
    var conn = new Promise(function (resolve) {
        observeErrors(socket).awaitFirst().then(function () {
            return resolve(false);
        }).catch(function () {
            return resolve(false);
        });
        // we try to get the first block
        // if it returns something, it probably works
        Promise.race([new Promise(function (resolve, reject) {
            return setTimeout(function () {
                return reject();
            }, 30000);
        }), _lookupBlockHash(socket, 0)]).then(function () {
            return resolve(true);
        }, function () {
            return resolve(false);
        });
    });
    return conn.then(function (res) {
        if (!res) {
            socket.close();
            return null;
        }
        return socket;
    });
}

function observeErrors(socket) {
    var errortypes = ['connect_error', 'reconnect_error', 'error', 'close', 'disconnect'];

    var s = _stream.Stream.combineFlat(errortypes.map(function (type) {
        return socket.observe(type).map(function (k) {
            return new Error(JSON.stringify(k) + ' (' + type + ')');
        });
    }));
    return s;
}

function convertTx(zcash, bcTx) {
    return {
        zcash: zcash,
        hex: bcTx.hex,
        height: bcTx.height === -1 ? null : bcTx.height,
        timestamp: bcTx.blockTimestamp,
        hash: bcTx.hash,
        inputAddresses: bcTx.inputs.map(function (input) {
            return input.address;
        }),
        outputAddresses: bcTx.outputs.map(function (output) {
            return output.address;
        }),
        fee: bcTx.feeSatoshis,
        vsize: bcTx.size == null ? bcTx.hex.length / 2 : bcTx.size
    };
}