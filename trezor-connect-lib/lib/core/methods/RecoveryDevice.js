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

var _builder = require("../../message/builder");

var RecoveryDevice =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(RecoveryDevice, _AbstractMethod);

  function RecoveryDevice(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['management'];
    _this.useEmptyPassphrase = true;
    var payload = message.payload;
    (0, _paramsValidator.validateParams)(payload, [{
      name: 'word_count',
      type: 'number'
    }, {
      name: 'passphrase_protection',
      type: 'boolean'
    }, {
      name: 'pin_protection',
      type: 'boolean'
    }, {
      name: 'language',
      type: 'string'
    }, {
      name: 'label',
      type: 'string'
    }, {
      name: 'enforce_wordlist',
      type: 'boolean'
    }, {
      name: 'type',
      type: 'number'
    }, {
      name: 'u2f_counter',
      type: 'number'
    }, {
      name: 'dry_run',
      type: 'boolean'
    }]);
    _this.params = {
      word_count: payload.word_count,
      passphrase_protection: payload.passphrase_protection,
      pin_protection: payload.pin_protection,
      language: payload.language,
      label: payload.label,
      enforce_wordlist: payload.enforce_wordlist,
      type: payload.type,
      u2f_counter: payload.u2f_counter,
      dry_run: payload.dry_run
    };
    _this.allowDeviceMode = [].concat(_this.allowDeviceMode, [UI.INITIALIZE]);
    _this.useDeviceState = false;
    return _this;
  }

  var _proto = RecoveryDevice.prototype;

  _proto.confirmation =
  /*#__PURE__*/
  function () {
    var _confirmation = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var uiPromise, uiResp;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.getPopupPromise().promise;

            case 2:
              // initialize user response promise
              uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device); // request confirmation view

              this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'device-management',
                customConfirmButton: {
                  className: 'confirm',
                  label: 'Proceed'
                },
                label: 'Do you want to recover device from seed?'
              })); // wait for user action

              _context.next = 6;
              return uiPromise.promise;

            case 6:
              uiResp = _context.sent;
              console.warn('uiResp');
              return _context.abrupt("return", uiResp.payload);

            case 9:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function confirmation() {
      return _confirmation.apply(this, arguments);
    }

    return confirmation;
  }();

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return this.device.getCommands().recoveryDevice(this.params);

            case 2:
              return _context2.abrupt("return", _context2.sent);

            case 3:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function run() {
      return _run.apply(this, arguments);
    }

    return run;
  }();

  return RecoveryDevice;
}(_AbstractMethod2.default);

exports.default = RecoveryDevice;