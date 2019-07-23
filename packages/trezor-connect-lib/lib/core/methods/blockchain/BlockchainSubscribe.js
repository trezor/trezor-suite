"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("../AbstractMethod"));

var _paramsValidator = require("../helpers/paramsValidator");

var BLOCKCHAIN = _interopRequireWildcard(require("../../../constants/blockchain"));

var _errors = require("../../../constants/errors");

var _backend = require("../../../backend");

var _BlockchainLink = require("../../../backend/BlockchainLink");

var _CoinInfo = require("../../../data/CoinInfo");

var _builder = require("../../../message/builder");

var BlockchainSubscribe =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(BlockchainSubscribe, _AbstractMethod);

  function BlockchainSubscribe(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.useDevice = false;
    _this.useUi = false;
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [// { name: 'accounts', type: 'array', obligatory: true },
    {
      name: 'coin',
      type: 'string',
      obligatory: true
    }]);
    var coinInfo = (0, _CoinInfo.getCoinInfo)(payload.coin);

    if (!coinInfo) {
      throw _errors.NO_COIN_INFO;
    }

    _this.params = {
      accounts: payload.accounts,
      coinInfo: coinInfo
    };
    return _this;
  }

  var _proto = BlockchainSubscribe.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(this.params.coinInfo.type === 'misc')) {
                _context.next = 6;
                break;
              }

              _context.next = 3;
              return this.subscribeBlockchain();

            case 3:
              return _context.abrupt("return", _context.sent);

            case 6:
              _context.next = 8;
              return this.subscribeBlockbook();

            case 8:
              return _context.abrupt("return", _context.sent);

            case 9:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function run() {
      return _run.apply(this, arguments);
    }

    return run;
  }();

  _proto.subscribeBlockchain =
  /*#__PURE__*/
  function () {
    var _subscribeBlockchain = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      var backend;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return (0, _BlockchainLink.create)(this.params.coinInfo, this.postMessage);

            case 2:
              backend = _context2.sent;
              backend.subscribe(this.params.accounts);
              return _context2.abrupt("return", {
                subscribed: true
              });

            case 5:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function subscribeBlockchain() {
      return _subscribeBlockchain.apply(this, arguments);
    }

    return subscribeBlockchain;
  }();

  _proto.subscribeBlockbook =
  /*#__PURE__*/
  function () {
    var _subscribeBlockbook = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3() {
      var _this2 = this;

      var coinInfo, backend;
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              coinInfo = this.params.coinInfo;

              if (!(coinInfo.type === 'misc')) {
                _context3.next = 3;
                break;
              }

              throw new Error('Invalid CoinInfo object');

            case 3:
              _context3.prev = 3;
              _context3.next = 6;
              return (0, _backend.create)(coinInfo);

            case 6:
              backend = _context3.sent;
              _context3.next = 13;
              break;

            case 9:
              _context3.prev = 9;
              _context3.t0 = _context3["catch"](3);
              this.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.ERROR, {
                coin: this.params.coinInfo,
                error: _context3.t0.message
              }));
              throw _context3.t0;

            case 13:
              backend.subscribe(this.params.accounts, function (hash, block) {
                _this2.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.BLOCK, {
                  coin: _this2.params.coinInfo,
                  hash: hash,
                  block: block
                }));
              }, function (notification) {
                _this2.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.NOTIFICATION, {
                  coin: _this2.params.coinInfo,
                  notification: notification
                }));
              }, function (error) {
                _this2.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.ERROR, {
                  coin: _this2.params.coinInfo,
                  error: error.message
                }));
              });
              this.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.CONNECT, {
                coin: this.params.coinInfo,
                info: {
                  fee: '0',
                  block: 0
                }
              }));
              return _context3.abrupt("return", {
                subscribed: true
              });

            case 16:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this, [[3, 9]]);
    }));

    function subscribeBlockbook() {
      return _subscribeBlockbook.apply(this, arguments);
    }

    return subscribeBlockbook;
  }();

  return BlockchainSubscribe;
}(_AbstractMethod2.default);

exports.default = BlockchainSubscribe;