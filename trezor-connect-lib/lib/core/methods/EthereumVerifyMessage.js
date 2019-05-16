'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _ethereumUtils = require("../../utils/ethereumUtils");

var EthereumVerifyMessage =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(EthereumVerifyMessage, _AbstractMethod);

  function EthereumVerifyMessage(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['read', 'write'];
    _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, null, _this.firmwareRange);
    _this.info = 'Verify message';
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'address',
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
    }, {
      name: 'hex',
      type: 'boolean'
    }]);
    var messageHex = payload.hex ? (0, _ethereumUtils.messageToHex)(payload.message) : Buffer.from(payload.message, 'utf8').toString('hex');
    _this.params = {
      address: (0, _ethereumUtils.stripHexPrefix)(payload.address),
      signature: (0, _ethereumUtils.stripHexPrefix)(payload.signature),
      message: messageHex
    };
    return _this;
  }

  var _proto = EthereumVerifyMessage.prototype;

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
              return this.device.getCommands().ethereumVerifyMessage(this.params.address, this.params.signature, this.params.message);

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

  return EthereumVerifyMessage;
}(_AbstractMethod2.default);

exports.default = EthereumVerifyMessage;