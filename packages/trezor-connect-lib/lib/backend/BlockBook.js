"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _hdWallet = require("hd-wallet");

var _trezorUtxoLib = require("trezor-utxo-lib");

var ERROR = _interopRequireWildcard(require("../constants/errors"));

var _CoinInfo = require("../data/CoinInfo");

var _networkUtils = require("../utils/networkUtils");

var _workers = require("../env/node/workers");

_trezorUtxoLib.Transaction.USE_STRING_VALUES = true;

var BlockBook =
/*#__PURE__*/
function () {
  function BlockBook(options) {
    (0, _defineProperty2.default)(this, "subscribed", false);

    if (options.urls.length < 1) {
      throw ERROR.BACKEND_NO_URL;
    }

    this.options = options;
    var worker = new _workers.FastXpubWorker();
    var blockchain = new _hdWallet.BitcoreBlockchain(this.options.urls, function () {
      return new _workers.SocketWorker();
    }, options.coinInfo.network);
    this.blockchain = blockchain;
    var filePromise = typeof WebAssembly !== 'undefined' ? (0, _networkUtils.httpRequest)(_workers.FastXpubWasm, 'binary') : Promise.reject(); // this.blockchain.errors.values.attach(() => { this._setError(); });

    this.blockchain.errors.values.attach(this._setError.bind(this));
    this.discovery = new _hdWallet.WorkerDiscovery(function () {
      return new _workers.DiscoveryWorker();
    }, worker, filePromise, this.blockchain);
  }

  var _proto = BlockBook.prototype;

  _proto._setError = function _setError(error) {
    this.error = error;
    this.subscribed = false; // TODO: remove all stream listeners
    // this instance will not be used anymore
  };

  _proto.loadCoinInfo =
  /*#__PURE__*/
  function () {
    var _loadCoinInfo = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(coinInfo) {
      var socket, networkInfo, _hash;

      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.blockchain.socket.promise;

            case 2:
              socket = _context.sent;
              _context.next = 5;
              return socket.send({
                method: 'getInfo',
                params: []
              });

            case 5:
              networkInfo = _context.sent;

              if (coinInfo) {
                _context.next = 13;
                break;
              }

              _context.next = 9;
              return this.blockchain.lookupBlockHash(0);

            case 9:
              _hash = _context.sent;
              coinInfo = (0, _CoinInfo.getCoinInfoByHash)(_hash, networkInfo);

              if (coinInfo) {
                _context.next = 13;
                break;
              }

              throw new Error('Failed to load coinInfo ' + _hash);

            case 13:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function loadCoinInfo(_x) {
      return _loadCoinInfo.apply(this, arguments);
    }

    return loadCoinInfo;
  }();

  _proto.loadAccountInfo =
  /*#__PURE__*/
  function () {
    var _loadAccountInfo = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2(xpub, data, coinInfo, progress, setDisposer) {
      var segwit_s, discovery, info;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!this.error) {
                _context2.next = 2;
                break;
              }

              throw this.error;

            case 2:
              segwit_s = coinInfo.segwit ? 'p2sh' : 'off';
              discovery = this.discovery.discoverAccount(data, xpub, coinInfo.network, segwit_s, !!coinInfo.cashAddrPrefix, 20, new Date().getTimezoneOffset());
              setDisposer(function () {
                return discovery.dispose(new Error('Interrupted by user'));
              });
              discovery.stream.values.attach(function (status) {
                progress(status);
              });
              this.blockchain.errors.values.attach(function (e) {
                discovery.dispose(e);
              });
              _context2.next = 9;
              return discovery.ending;

            case 9:
              info = _context2.sent;
              discovery.stream.dispose();
              return _context2.abrupt("return", info);

            case 12:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function loadAccountInfo(_x2, _x3, _x4, _x5, _x6) {
      return _loadAccountInfo.apply(this, arguments);
    }

    return loadAccountInfo;
  }();

  _proto.subscribe = function subscribe(accounts, blockHandler, notificationHandler, errorHandler) {
    var _this = this;

    if (!this.subscribed) {
      this.subscribed = true;
      this.blockchain.blocks.values.attach(function (hash) {
        var asyncFN =
        /*#__PURE__*/
        function () {
          var _ref = (0, _asyncToGenerator2.default)(
          /*#__PURE__*/
          _regenerator.default.mark(function _callee3(hash) {
            var _ref2, height;

            return _regenerator.default.wrap(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    _context3.next = 2;
                    return _this.blockchain.lookupSyncStatus();

                  case 2:
                    _ref2 = _context3.sent;
                    height = _ref2.height;
                    blockHandler(hash, height);

                  case 5:
                  case "end":
                    return _context3.stop();
                }
              }
            }, _callee3, this);
          }));

          return function asyncFN(_x7) {
            return _ref.apply(this, arguments);
          };
        }();

        if (typeof hash === 'string') {
          asyncFN(hash);
        }
      });
      this.blockchain.notifications.values.attach(notificationHandler);
      this.blockchain.errors.values.attach(errorHandler);
    } // TODO: verify address duplicates
    // TODO: add option to remove subscription
    // this.blockchain.subscribe(new Set(accounts));

  };

  _proto.monitorAccountActivity = function monitorAccountActivity(xpub, data, coinInfo) {
    if (this.error) {
      throw this.error;
    }

    var segwit_s = coinInfo.segwit ? 'p2sh' : 'off';
    var res = this.discovery.monitorAccountActivity(data, xpub, coinInfo.network, segwit_s, !!coinInfo.cashAddrPrefix, 20, new Date().getTimezoneOffset());
    this.blockchain.errors.values.attach(function () {
      res.dispose();
    });
    return res;
  };

  _proto.loadTransactions =
  /*#__PURE__*/
  function () {
    var _loadTransactions = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee4(txs) {
      var _this2 = this;

      return _regenerator.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (!this.error) {
                _context4.next = 2;
                break;
              }

              throw this.error;

            case 2:
              return _context4.abrupt("return", Promise.all(txs.map(function (id) {
                return _this2.loadTransaction(id);
              })));

            case 3:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function loadTransactions(_x8) {
      return _loadTransactions.apply(this, arguments);
    }

    return loadTransactions;
  }();

  _proto.loadTransaction =
  /*#__PURE__*/
  function () {
    var _loadTransaction = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee5(id) {
      var tx;
      return _regenerator.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (!this.error) {
                _context5.next = 2;
                break;
              }

              throw this.error;

            case 2:
              _context5.next = 4;
              return this.blockchain.lookupTransaction(id);

            case 4:
              tx = _context5.sent;
              return _context5.abrupt("return", _trezorUtxoLib.Transaction.fromHex(tx.hex, this.options.coinInfo.network));

            case 6:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function loadTransaction(_x9) {
      return _loadTransaction.apply(this, arguments);
    }

    return loadTransaction;
  }();

  _proto.loadCurrentHeight =
  /*#__PURE__*/
  function () {
    var _loadCurrentHeight = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee6() {
      var _ref3, height;

      return _regenerator.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              if (!this.error) {
                _context6.next = 2;
                break;
              }

              throw this.error;

            case 2:
              _context6.next = 4;
              return this.blockchain.lookupSyncStatus();

            case 4:
              _ref3 = _context6.sent;
              height = _ref3.height;
              return _context6.abrupt("return", height);

            case 7:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    function loadCurrentHeight() {
      return _loadCurrentHeight.apply(this, arguments);
    }

    return loadCurrentHeight;
  }();

  _proto.sendTransaction =
  /*#__PURE__*/
  function () {
    var _sendTransaction = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee7(txBytes) {
      return _regenerator.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              if (!this.error) {
                _context7.next = 2;
                break;
              }

              throw this.error;

            case 2:
              _context7.next = 4;
              return this.blockchain.sendTransaction(txBytes.toString('hex'));

            case 4:
              return _context7.abrupt("return", _context7.sent);

            case 5:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, this);
    }));

    function sendTransaction(_x10) {
      return _sendTransaction.apply(this, arguments);
    }

    return sendTransaction;
  }();

  _proto.sendTransactionHex =
  /*#__PURE__*/
  function () {
    var _sendTransactionHex = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee8(txHex) {
      return _regenerator.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              if (!this.error) {
                _context8.next = 2;
                break;
              }

              throw this.error;

            case 2:
              _context8.next = 4;
              return this.blockchain.sendTransaction(txHex);

            case 4:
              return _context8.abrupt("return", _context8.sent);

            case 5:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8, this);
    }));

    function sendTransactionHex(_x11) {
      return _sendTransactionHex.apply(this, arguments);
    }

    return sendTransactionHex;
  }();

  _proto.dispose = function dispose() {};

  return BlockBook;
}();

exports.default = BlockBook;