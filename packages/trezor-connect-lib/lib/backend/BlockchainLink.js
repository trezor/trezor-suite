"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.create = exports.find = exports.default = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _trezorBlockchainLink = _interopRequireDefault(require("trezor-blockchain-link"));

var _builder = require("../message/builder");

var BLOCKCHAIN = _interopRequireWildcard(require("../constants/blockchain"));

var _workers = require("../env/node/workers");

var getWorker = function getWorker(type) {
  switch (type) {
    case 'ripple':
      return _workers.RippleWorker;

    default:
      return null;
  }
};

var Blockchain =
/*#__PURE__*/
function () {
  function Blockchain(options) {
    this.coinInfo = options.coinInfo;
    this.postMessage = options.postMessage;
    var settings = options.coinInfo.blockchainLink;

    if (!settings) {
      throw new Error('BlockchainLink settings not found in coins.json');
    }

    var worker = getWorker(settings.type);

    if (!worker) {
      throw new Error('BlockchainLink worker not found');
    }

    this.link = new _trezorBlockchainLink.default({
      name: this.coinInfo.shortcut,
      worker: worker,
      server: settings.url,
      debug: false
    });
  }

  var _proto = Blockchain.prototype;

  _proto.onError = function onError(error) {
    this.link.removeAllListeners();
    this.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.ERROR, {
      coin: this.coinInfo,
      error: error
    }));
    remove(this); // eslint-disable-line no-use-before-define
  };

  _proto.init =
  /*#__PURE__*/
  function () {
    var _init = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      var _this = this;

      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              this.link.on('connected',
              /*#__PURE__*/
              (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee() {
                var info;
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return _this.link.getInfo();

                      case 2:
                        info = _context.sent;

                        _this.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.CONNECT, {
                          coin: _this.coinInfo,
                          info: {
                            block: info.block
                          }
                        }));

                      case 4:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              })));
              this.link.on('disconnected', function () {
                _this.onError('Disconnected');
              });
              this.link.on('error', function (error) {
                _this.onError(error.message);
              });
              _context2.prev = 3;
              _context2.next = 6;
              return this.link.connect();

            case 6:
              _context2.next = 12;
              break;

            case 8:
              _context2.prev = 8;
              _context2.t0 = _context2["catch"](3);
              this.onError(_context2.t0.message);
              throw _context2.t0;

            case 12:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[3, 8]]);
    }));

    function init() {
      return _init.apply(this, arguments);
    }

    return init;
  }();

  _proto.getNetworkInfo =
  /*#__PURE__*/
  function () {
    var _getNetworkInfo = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3() {
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return this.link.getInfo();

            case 2:
              return _context3.abrupt("return", _context3.sent);

            case 3:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function getNetworkInfo() {
      return _getNetworkInfo.apply(this, arguments);
    }

    return getNetworkInfo;
  }();

  _proto.getAccountInfo =
  /*#__PURE__*/
  function () {
    var _getAccountInfo = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee4(descriptor, options) {
      return _regenerator.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return this.link.getAccountInfo({
                descriptor: descriptor,
                options: options
              });

            case 2:
              return _context4.abrupt("return", _context4.sent);

            case 3:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function getAccountInfo(_x, _x2) {
      return _getAccountInfo.apply(this, arguments);
    }

    return getAccountInfo;
  }();

  _proto.estimateFee =
  /*#__PURE__*/
  function () {
    var _estimateFee = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee5(options) {
      return _regenerator.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return this.link.estimateFee(options);

            case 2:
              return _context5.abrupt("return", _context5.sent);

            case 3:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function estimateFee(_x3) {
      return _estimateFee.apply(this, arguments);
    }

    return estimateFee;
  }();

  _proto.subscribe =
  /*#__PURE__*/
  function () {
    var _subscribe = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee6(accounts) {
      var _this2 = this;

      return _regenerator.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              if (this.link.listenerCount('block') === 0) {
                this.link.on('block', function (block) {
                  _this2.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.BLOCK, (0, _objectSpread2.default)({
                    coin: _this2.coinInfo
                  }, block)));
                });
              }

              if (this.link.listenerCount('notification') === 0) {
                this.link.on('notification', function (notification) {
                  _this2.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.NOTIFICATION, {
                    coin: _this2.coinInfo,
                    notification: notification
                  }));
                });
              }

              this.link.subscribe({
                type: 'block'
              });
              this.link.subscribe({
                type: 'notification',
                addresses: accounts
              });

            case 4:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    function subscribe(_x4) {
      return _subscribe.apply(this, arguments);
    }

    return subscribe;
  }();

  _proto.pushTransaction =
  /*#__PURE__*/
  function () {
    var _pushTransaction = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee7(tx) {
      return _regenerator.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return this.link.pushTransaction(tx);

            case 2:
              return _context7.abrupt("return", _context7.sent);

            case 3:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, this);
    }));

    function pushTransaction(_x5) {
      return _pushTransaction.apply(this, arguments);
    }

    return pushTransaction;
  }();

  _proto.disconnect =
  /*#__PURE__*/
  function () {
    var _disconnect = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee8() {
      return _regenerator.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              this.link.disconnect();
              this.onError('Disconnected');

            case 2:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8, this);
    }));

    function disconnect() {
      return _disconnect.apply(this, arguments);
    }

    return disconnect;
  }();

  return Blockchain;
}();

exports.default = Blockchain;
var instances = [];

var remove = function remove(backend) {
  var index = instances.indexOf(backend);

  if (index >= 0) {
    instances.splice(index, 1);
  }
};

var find = function find(name) {
  for (var i = 0; i < instances.length; i++) {
    if (instances[i].coinInfo.name === name) {
      if (instances[i].error) {
        remove(instances[i]);
      } else {
        return instances[i];
      }
    }
  }

  return null;
};

exports.find = find;

var create =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee9(coinInfo, postMessage) {
    var backend;
    return _regenerator.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            backend = find(coinInfo.name);

            if (backend) {
              _context9.next = 13;
              break;
            }

            backend = new Blockchain({
              coinInfo: coinInfo,
              postMessage: postMessage
            });
            _context9.prev = 3;
            _context9.next = 6;
            return backend.init();

          case 6:
            _context9.next = 12;
            break;

          case 8:
            _context9.prev = 8;
            _context9.t0 = _context9["catch"](3);
            remove(backend);
            throw _context9.t0;

          case 12:
            instances.push(backend);

          case 13:
            return _context9.abrupt("return", backend);

          case 14:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, this, [[3, 8]]);
  }));

  return function create(_x6, _x7) {
    return _ref2.apply(this, arguments);
  };
}();

exports.create = create;