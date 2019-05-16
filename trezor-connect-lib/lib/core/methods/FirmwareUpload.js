"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _paramsValidator = require("./helpers/paramsValidator");

var _uploadFirmware = require("./helpers/uploadFirmware");

var FirmwareUpload =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(FirmwareUpload, _AbstractMethod);

  function FirmwareUpload(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.useEmptyPassphrase = true;
    _this.requiredPermissions = ['management'];
    _this.allowDeviceMode = [].concat(_this.allowDeviceMode, [UI.BOOTLOADER, UI.INITIALIZE]);
    _this.useDeviceState = false;
    var payload = message.payload;
    (0, _paramsValidator.validateParams)(payload, [{
      name: 'payload',
      type: 'buffer',
      obligatory: true
    }, {
      name: 'hash',
      type: 'string'
    }, {
      name: 'offset',
      type: 'number'
    }, {
      name: 'length',
      type: 'number'
    }]);
    _this.params = {
      payload: payload.payload,
      offset: payload.offset,
      length: payload.length
    };
    return _this;
  }

  var _proto = FirmwareUpload.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var device, params, response;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              device = this.device, params = this.params;
              _context.next = 3;
              return (0, _uploadFirmware.uploadFirmware)(device.getCommands().typedCall.bind(device.getCommands()), params.payload, params.offset, params.length, device.features.major_version);

            case 3:
              response = _context.sent;
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

  return FirmwareUpload;
}(_AbstractMethod2.default);

exports.default = FirmwareUpload;