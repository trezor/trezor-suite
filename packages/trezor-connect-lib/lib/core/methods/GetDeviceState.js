'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var GetDeviceState =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(GetDeviceState, _AbstractMethod);

  function GetDeviceState(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = [];
    return _this;
  }

  var _proto = GetDeviceState.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var response, state;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!this.device.getState()) {
                _context.next = 2;
                break;
              }

              return _context.abrupt("return", {
                state: this.device.getState()
              });

            case 2:
              _context.next = 4;
              return this.device.getCommands().getDeviceState();

            case 4:
              response = _context.sent;
              state = this.device.getState() || response;
              return _context.abrupt("return", {
                state: state
              });

            case 7:
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

  return GetDeviceState;
}(_AbstractMethod2.default);

exports.default = GetDeviceState;