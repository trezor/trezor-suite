"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _trezorUtxoLib = require("trezor-utxo-lib");

var _semverCompare = _interopRequireDefault(require("semver-compare"));

var _Device = _interopRequireDefault(require("../../device/Device"));

var _DataManager = _interopRequireDefault(require("../../data/DataManager"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var DEVICE = _interopRequireWildcard(require("../../constants/device"));

var ERROR = _interopRequireWildcard(require("../../constants/errors"));

var _storage = require("../../iframe/storage");

var _builder = require("../../message/builder");

var AbstractMethod =
/*#__PURE__*/
function () {
  // method name
  // method info, displayed in popup info-panel
  // should use popup?
  // use device
  // should validate device state?
  // used in device management (like ResetDevice allow !UI.INITIALIZED)
  // // callbacks
  function AbstractMethod(message) {
    var payload = message.payload;
    this.name = payload.method;
    this.responseID = message.id || 0;
    this.devicePath = payload.device ? payload.device.path : null;
    this.deviceInstance = payload.device ? payload.device.instance : 0; // expected state from method parameter.
    // it could be null

    this.deviceState = payload.device ? payload.device.state : null;
    this.hasExpectedDeviceState = payload.device ? payload.device.hasOwnProperty('state') : false;
    this.keepSession = typeof payload.keepSession === 'boolean' ? payload.keepSession : false;
    this.skipFinalReload = typeof payload.skipFinalReload === 'boolean' ? payload.skipFinalReload : false;
    this.overridePreviousCall = typeof payload.override === 'boolean' ? payload.override : false;
    this.overridden = false;
    this.useEmptyPassphrase = typeof payload.useEmptyPassphrase === 'boolean' ? payload.useEmptyPassphrase : false;
    this.allowSeedlessDevice = typeof payload.allowSeedlessDevice === 'boolean' ? payload.allowSeedlessDevice : false;
    this.allowDeviceMode = [];

    if (this.allowSeedlessDevice) {
      this.allowDeviceMode = [UI.SEEDLESS];
    }

    this.debugLink = false; // default values for all methods

    this.firmwareRange = {
      '1': {
        min: '1.0.0',
        max: '0'
      },
      '2': {
        min: '2.0.0',
        max: '0'
      }
    };
    this.useDevice = true;
    this.useDeviceState = true;
    this.useUi = true;
  }

  var _proto = AbstractMethod.prototype;

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
              return _context.abrupt("return", new Promise(function (resolve) {
                return resolve({});
              }));

            case 1:
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

  _proto.requestPermissions =
  /*#__PURE__*/
  function () {
    var _requestPermissions = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      var uiPromise, uiResp, permissionsResponse;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return this.getPopupPromise().promise;

            case 2:
              // initialize user response promise
              uiPromise = this.createUiPromise(UI.RECEIVE_PERMISSION, this.device);
              this.postMessage(new _builder.UiMessage(UI.REQUEST_PERMISSION, {
                permissions: this.requiredPermissions,
                device: this.device.toMessageObject()
              })); // wait for response

              _context2.next = 6;
              return uiPromise.promise;

            case 6:
              uiResp = _context2.sent;
              permissionsResponse = uiResp.payload;

              if (!permissionsResponse.granted) {
                _context2.next = 11;
                break;
              }

              this.savePermissions(!permissionsResponse.remember);
              return _context2.abrupt("return", true);

            case 11:
              return _context2.abrupt("return", false);

            case 12:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function requestPermissions() {
      return _requestPermissions.apply(this, arguments);
    }

    return requestPermissions;
  }();

  _proto.checkPermissions = function checkPermissions() {
    var _this = this;

    var savedPermissions = (0, _storage.load)(_storage.PERMISSIONS_KEY);
    var notPermitted = [].concat(this.requiredPermissions);

    if (savedPermissions && Array.isArray(savedPermissions)) {
      // find permissions for this origin
      var originPermissions = savedPermissions.filter(function (p) {
        return p.origin === _DataManager.default.getSettings('origin');
      });

      if (originPermissions.length > 0) {
        // check if permission was granted
        notPermitted = notPermitted.filter(function (np) {
          var granted = originPermissions.find(function (p) {
            return p.type === np && p.device === _this.device.features.device_id;
          });
          return !granted;
        });
      }
    }

    this.requiredPermissions = notPermitted;
  };

  _proto.savePermissions = function savePermissions(temporary) {
    var _this2 = this;

    if (temporary === void 0) {
      temporary = false;
    }

    var savedPermissions = (0, _storage.load)(_storage.PERMISSIONS_KEY, temporary);

    if (!savedPermissions || !Array.isArray(savedPermissions)) {
      savedPermissions = JSON.parse('[]');
    }

    var permissionsToSave = this.requiredPermissions.map(function (p) {
      return {
        origin: _DataManager.default.getSettings('origin'),
        type: p,
        device: _this2.device.features.device_id
      };
    }); // check if this will be first time granted permission to read this device
    // if so, emit "device_connect" event because this wasn't send before

    var emitEvent = false;

    if (this.requiredPermissions.indexOf('read') >= 0) {
      var wasAlreadyGranted = savedPermissions.filter(function (p) {
        return p.origin === _DataManager.default.getSettings('origin') && p.type === 'read' && p.device === _this2.device.features.device_id;
      });

      if (wasAlreadyGranted.length < 1) {
        emitEvent = true;
      }
    } // find permissions for this origin


    var originPermissions = savedPermissions.filter(function (p) {
      return p.origin === _DataManager.default.getSettings('origin');
    });

    if (originPermissions.length > 0) {
      permissionsToSave = permissionsToSave.filter(function (p2s) {
        var granted = originPermissions.find(function (p) {
          return p.type === p2s.type && p.device === p2s.device;
        });
        return !granted;
      });
    }

    (0, _storage.save)(_storage.PERMISSIONS_KEY, savedPermissions.concat(permissionsToSave), temporary);

    if (emitEvent) {
      this.postMessage(new _builder.DeviceMessage(DEVICE.CONNECT, this.device.toMessageObject()));
    }
  };

  _proto.checkFirmwareRange =
  /*#__PURE__*/
  function () {
    var _checkFirmwareRange = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3(isUsingPopup) {
      var device, model, range, uiPromise, uiResp;
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              device = this.device;

              if (device.features) {
                _context3.next = 3;
                break;
              }

              return _context3.abrupt("return", null);

            case 3:
              model = device.features.major_version;
              range = this.firmwareRange[model];

              if (!(range.min === '0')) {
                _context3.next = 7;
                break;
              }

              return _context3.abrupt("return", UI.FIRMWARE_NOT_SUPPORTED);

            case 7:
              if (!(device.firmwareStatus === 'required' || (0, _semverCompare.default)(device.getVersion(), range.min) < 0)) {
                _context3.next = 9;
                break;
              }

              return _context3.abrupt("return", UI.FIRMWARE_OLD);

            case 9:
              if (!(range.max !== '0' && (0, _semverCompare.default)(device.getVersion(), range.max) > 0)) {
                _context3.next = 23;
                break;
              }

              if (!isUsingPopup) {
                _context3.next = 22;
                break;
              }

              _context3.next = 13;
              return this.getPopupPromise().promise;

            case 13:
              // initialize user response promise
              uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, device); // show unexpected state information and wait for confirmation

              this.postMessage(new _builder.UiMessage(UI.FIRMWARE_NOT_COMPATIBLE, device.toMessageObject()));
              _context3.next = 17;
              return uiPromise.promise;

            case 17:
              uiResp = _context3.sent;

              if (uiResp.payload) {
                _context3.next = 20;
                break;
              }

              throw ERROR.PERMISSIONS_NOT_GRANTED;

            case 20:
              _context3.next = 23;
              break;

            case 22:
              return _context3.abrupt("return", UI.FIRMWARE_NOT_COMPATIBLE);

            case 23:
              return _context3.abrupt("return", null);

            case 24:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function checkFirmwareRange(_x) {
      return _checkFirmwareRange.apply(this, arguments);
    }

    return checkFirmwareRange;
  }();

  _proto.getCustomMessages = function getCustomMessages() {
    return null;
  };

  _proto.__hash = function __hash(permission) {
    var host = _DataManager.default.getSettings('origin');

    var secret = permission + "#" + this.device.features.device_id + "#" + host;

    var hash = _trezorUtxoLib.crypto.hash256(Buffer.from(secret, 'binary'));

    return hash.toString('hex');
  };

  _proto.dispose = function dispose() {// to override
  };

  return AbstractMethod;
}();

exports.default = AbstractMethod;