'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var _CoinInfo = require("../../data/CoinInfo");

var SignMessage =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(SignMessage, _AbstractMethod);

  function SignMessage(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['read', 'write'];
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'coin',
      type: 'string'
    }, {
      name: 'message',
      type: 'string',
      obligatory: true
    }]);
    var path = (0, _pathUtils.validatePath)(payload.path);
    var coinInfo;

    if (payload.coin) {
      coinInfo = (0, _CoinInfo.getBitcoinNetwork)(payload.coin);
      (0, _paramsValidator.validateCoinPath)(coinInfo, path);
    } else {
      coinInfo = (0, _CoinInfo.getBitcoinNetwork)(path);
    }

    _this.info = (0, _pathUtils.getLabel)('Sign #NETWORK message', coinInfo);

    if (coinInfo) {
      // check required firmware with coinInfo support
      _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, coinInfo, _this.firmwareRange);
    }

    var messageHex = Buffer.from(payload.message, 'utf8').toString('hex');
    _this.params = {
      path: path,
      message: messageHex,
      coinInfo: coinInfo
    };
    return _this;
  }

  var _proto = SignMessage.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var response, signatureBuffer;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.device.getCommands().signMessage(this.params.path, this.params.message, this.params.coinInfo ? this.params.coinInfo.name : null);

            case 2:
              response = _context.sent;
              // convert signature to base64
              signatureBuffer = Buffer.from(response.signature, 'hex');
              return _context.abrupt("return", (0, _objectSpread2.default)({}, response, {
                signature: signatureBuffer.toString('base64')
              }));

            case 5:
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

  return SignMessage;
}(_AbstractMethod2.default);

exports.default = SignMessage;