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

var _pathUtils = require("../../utils/pathUtils");

var LiskSignMessage =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(LiskSignMessage, _AbstractMethod);

  function LiskSignMessage(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['read', 'write'];
    _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, (0, _CoinInfo.getMiscNetwork)('Lisk'), _this.firmwareRange);
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'message',
      type: 'string',
      obligatory: true
    }]);
    var path = (0, _pathUtils.validatePath)(payload.path, 3);
    _this.info = 'Sign Lisk Message'; // TODO: check if message is already in hex format

    var messageHex = Buffer.from(payload.message, 'utf8').toString('hex');
    _this.params = {
      path: path,
      message: messageHex
    };
    return _this;
  }

  var _proto = LiskSignMessage.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var response;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.device.getCommands().liskSignMessage(this.params.path, this.params.message);

            case 2:
              response = _context.sent;
              return _context.abrupt("return", {
                publicKey: response.public_key,
                signature: response.signature
              });

            case 4:
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

  return LiskSignMessage;
}(_AbstractMethod2.default);

exports.default = LiskSignMessage;