'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var _CoinInfo = require("../../data/CoinInfo");

var _ethereumUtils = require("../../utils/ethereumUtils");

var EthereumSignMessage =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(EthereumSignMessage, _AbstractMethod);

  function EthereumSignMessage(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['read', 'write'];
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'message',
      type: 'string',
      obligatory: true
    }, {
      name: 'hex',
      type: 'boolean'
    }]);
    var path = (0, _pathUtils.validatePath)(payload.path, 3);
    var network = (0, _CoinInfo.getEthereumNetwork)(path);
    _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, network, _this.firmwareRange);
    _this.info = (0, _ethereumUtils.getNetworkLabel)('Sign #NETWORK message', network);
    var messageHex = payload.hex ? (0, _ethereumUtils.messageToHex)(payload.message) : Buffer.from(payload.message, 'utf8').toString('hex');
    _this.params = {
      path: path,
      network: network,
      message: messageHex
    };
    return _this;
  }

  var _proto = EthereumSignMessage.prototype;

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
              return this.device.getCommands().ethereumSignMessage(this.params.path, this.params.message);

            case 2:
              response = _context.sent;
              response.address = (0, _ethereumUtils.toChecksumAddress)(response.address, this.params.network);
              return _context.abrupt("return", response);

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

  return EthereumSignMessage;
}(_AbstractMethod2.default);

exports.default = EthereumSignMessage;