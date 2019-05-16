"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var ChangePin =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(ChangePin, _AbstractMethod);

  function ChangePin(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.useEmptyPassphrase = true;
    _this.requiredPermissions = ['management'];
    var payload = message.payload;
    (0, _paramsValidator.validateParams)(payload, [{
      name: 'remove',
      type: 'boolean'
    }]);
    _this.params = {
      remove: payload.remove
    };
    return _this;
  }

  var _proto = ChangePin.prototype;

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
              return this.device.getCommands().changePin(this.params);

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

  return ChangePin;
}(_AbstractMethod2.default);

exports.default = ChangePin;