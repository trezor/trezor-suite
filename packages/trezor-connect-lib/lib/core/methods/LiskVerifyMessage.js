'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var LiskVerifyMessage =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(LiskVerifyMessage, _AbstractMethod);

  function LiskVerifyMessage(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['read', 'write'];
    _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, (0, _CoinInfo.getMiscNetwork)('Lisk'), _this.firmwareRange);
    _this.info = 'Verify Lisk message';
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'publicKey',
      type: 'string',
      obligatory: true
    }, {
      name: 'signature',
      type: 'string',
      obligatory: true
    }, {
      name: 'message',
      type: 'string',
      obligatory: true
    }]); // TODO: check if message is already in hex format

    var messageHex = Buffer.from(payload.message, 'utf8').toString('hex');
    _this.params = {
      publicKey: payload.publicKey,
      signature: payload.signature,
      message: messageHex
    };
    return _this;
  }

  var _proto = LiskVerifyMessage.prototype;

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
              _context.next = 2;
              return this.device.getCommands().liskVerifyMessage(this.params.publicKey, this.params.signature, this.params.message);

            case 2:
              return _context.abrupt("return", _context.sent);

            case 3:
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

  return LiskVerifyMessage;
}(_AbstractMethod2.default);

exports.default = LiskVerifyMessage;