'use strict';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var BLOCKCHAIN = _interopRequireWildcard(require("../../constants/blockchain"));

var _errors = require("../../constants/errors");

var _backend = _interopRequireWildcard(require("../../backend"));

var _CoinInfo = require("../../data/CoinInfo");

var _builder = require("../../message/builder");

var BlockchainSubscribe =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(BlockchainSubscribe, _AbstractMethod);

  function BlockchainSubscribe(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = [];
    _this.info = '';
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
      var _this2 = this;

      var coinInfo;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              coinInfo = this.params.coinInfo;

              if (!(coinInfo.type === 'misc')) {
                _context.next = 3;
                break;
              }

              throw new Error('Invalid CoinInfo object');

            case 3:
              _context.next = 5;
              return (0, _backend.create)(coinInfo);

            case 5:
              this.backend = _context.sent;
              this.backend.subscribe(this.params.accounts, function (hash, height) {
                _this2.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.BLOCK, {
                  coin: coinInfo,
                  hash: hash,
                  block: 0,
                  height: height
                }));
              }, function (notification) {
                _this2.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.NOTIFICATION, {
                  coin: coinInfo,
                  notification: notification
                }));
              }, function (error) {
                _this2.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.ERROR, {
                  coin: coinInfo,
                  error: error.message
                }));
              });
              this.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.CONNECT, {
                coin: coinInfo,
                info: {
                  fee: '0',
                  block: 0
                }
              }));
              return _context.abrupt("return", {
                subscribed: true
              });

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

  return BlockchainSubscribe;
}(_AbstractMethod2.default);

exports.default = BlockchainSubscribe;