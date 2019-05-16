"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _events = _interopRequireDefault(require("events"));

var _semverCompare = _interopRequireDefault(require("semver-compare"));

var _DeviceCommands = _interopRequireDefault(require("./DeviceCommands"));

var UI = _interopRequireWildcard(require("../constants/ui"));

var DEVICE = _interopRequireWildcard(require("../constants/device"));

var ERROR = _interopRequireWildcard(require("../constants/errors"));

var _deferred = require("../utils/deferred");

var _DataManager = _interopRequireDefault(require("../data/DataManager"));

var _FirmwareInfo = require("../data/FirmwareInfo");

var _debug = _interopRequireWildcard(require("../utils/debug"));

// custom log
var _log = (0, _debug.init)('Device');

var parseRunOptions = function parseRunOptions(options) {
  if (!options) options = {};
  return options;
};
/**
 *
 *
 * @export
 * @class Device
 * @extends {EventEmitter}
 */


var Device =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inheritsLoose2.default)(Device, _EventEmitter);

  // cachedPassphrase: ?string;
  function Device(transport, descriptor) {
    var _this;

    _this = _EventEmitter.call(this) || this;
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "featuresNeedsReload", false);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "deferredActions", {});
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "loaded", false);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "inconsistent", false);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "featuresTimestamp", 0);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "cachedPassphrase", []);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "keepSession", false);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "instance", 0);
    _log.enabled = _DataManager.default.getSettings('debug'); // === immutable properties

    _this.transport = transport;
    _this.originalDescriptor = descriptor;
    _this.hasDebugLink = descriptor.debug; // this will be released after first run

    _this.firstRunPromise = (0, _deferred.create)();
    return _this;
  }

  Device.fromDescriptor =
  /*#__PURE__*/
  function () {
    var _fromDescriptor = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(transport, originalDescriptor) {
      var descriptor, device;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              descriptor = (0, _objectSpread2.default)({}, originalDescriptor, {
                session: null
              });
              _context.prev = 1;
              device = new Device(transport, descriptor);
              return _context.abrupt("return", device);

            case 6:
              _context.prev = 6;
              _context.t0 = _context["catch"](1);

              _log.error('Device.fromDescriptor', _context.t0);

              throw _context.t0;

            case 10:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this, [[1, 6]]);
    }));

    function fromDescriptor(_x, _x2) {
      return _fromDescriptor.apply(this, arguments);
    }

    return fromDescriptor;
  }();

  Device.createUnacquired = function createUnacquired(transport, descriptor) {
    return new Device(transport, descriptor);
  };

  var _proto = Device.prototype;

  _proto.acquire =
  /*#__PURE__*/
  function () {
    var _acquire = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      var sessionID;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              // will be resolved after trezor-link acquire event
              this.deferredActions[DEVICE.ACQUIRE] = (0, _deferred.create)();
              this.deferredActions[DEVICE.ACQUIRED] = (0, _deferred.create)();
              _context2.prev = 2;
              _context2.next = 5;
              return this.transport.acquire({
                path: this.originalDescriptor.path,
                previous: this.originalDescriptor.session
              }, false);

            case 5:
              sessionID = _context2.sent;

              _log.warn('Expected session id:', sessionID);

              this.activitySessionID = sessionID;
              this.deferredActions[DEVICE.ACQUIRED].resolve();
              delete this.deferredActions[DEVICE.ACQUIRED];

              if (this.commands) {
                this.commands.dispose();
              }

              this.commands = new _DeviceCommands.default(this, this.transport, sessionID); // future defer for trezor-link release event

              this.deferredActions[DEVICE.RELEASE] = (0, _deferred.create)();
              _context2.next = 25;
              break;

            case 15:
              _context2.prev = 15;
              _context2.t0 = _context2["catch"](2);
              this.deferredActions[DEVICE.ACQUIRED].resolve();
              delete this.deferredActions[DEVICE.ACQUIRED];

              if (!this.runPromise) {
                _context2.next = 23;
                break;
              }

              this.runPromise.reject(_context2.t0);
              _context2.next = 24;
              break;

            case 23:
              throw _context2.t0;

            case 24:
              this.runPromise = null;

            case 25:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[2, 15]]);
    }));

    function acquire() {
      return _acquire.apply(this, arguments);
    }

    return acquire;
  }();

  _proto.release =
  /*#__PURE__*/
  function () {
    var _release = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3() {
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (!(this.isUsedHere() && !this.keepSession && this.activitySessionID)) {
                _context3.next = 9;
                break;
              }

              if (this.commands) {
                this.commands.dispose();
              }

              _context3.prev = 2;
              _context3.next = 5;
              return this.transport.release(this.activitySessionID, false, false);

            case 5:
              _context3.next = 9;
              break;

            case 7:
              _context3.prev = 7;
              _context3.t0 = _context3["catch"](2);

            case 9:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this, [[2, 7]]);
    }));

    function release() {
      return _release.apply(this, arguments);
    }

    return release;
  }();

  _proto.cleanup = function cleanup() {
    this.release();
    this.removeAllListeners(); // make sure that DEVICE_CALL_IN_PROGRESS will not be thrown

    this.runPromise = null;
  };

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee4(fn, options) {
      return _regenerator.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (!this.runPromise) {
                _context4.next = 3;
                break;
              }

              _log.debug('Previous call is still running');

              throw ERROR.DEVICE_CALL_IN_PROGRESS;

            case 3:
              options = parseRunOptions(options);
              this.runPromise = (0, _deferred.create)(this._runInner.bind(this, fn, options));
              return _context4.abrupt("return", this.runPromise.promise);

            case 6:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function run(_x3, _x4) {
      return _run.apply(this, arguments);
    }

    return run;
  }();

  _proto.override =
  /*#__PURE__*/
  function () {
    var _override = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee5(error) {
      return _regenerator.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (!this.deferredActions[DEVICE.ACQUIRE]) {
                _context5.next = 3;
                break;
              }

              _context5.next = 3;
              return this.deferredActions[DEVICE.ACQUIRE].promise;

            case 3:
              if (this.runPromise) {
                this.runPromise.reject(error);
                this.runPromise = null;
              }

              if (!(!this.keepSession && this.deferredActions[DEVICE.RELEASE])) {
                _context5.next = 7;
                break;
              }

              _context5.next = 7;
              return this.deferredActions[DEVICE.RELEASE].promise;

            case 7:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function override(_x5) {
      return _override.apply(this, arguments);
    }

    return override;
  }();

  _proto.interruptionFromUser = function interruptionFromUser(error) {
    _log.debug('+++++interruptionFromUser');

    if (this.commands) {
      this.commands.dispose();
    }

    if (this.runPromise) {
      // reject inner defer
      this.runPromise.reject(error);
      this.runPromise = null; // release device

      if (this.deferredActions[DEVICE.RELEASE]) {
        this.release();
      }
    }
  };

  _proto.interruptionFromOutside = function interruptionFromOutside() {
    _log.debug('+++++interruptionFromOutside');

    if (this.commands) {
      this.commands.dispose();
    }

    if (this.runPromise) {
      this.runPromise.reject(ERROR.DEVICE_USED_ELSEWHERE);
      this.runPromise = null;
    }
  };

  _proto._runInner =
  /*#__PURE__*/
  function () {
    var _runInner2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee6(fn, options) {
      return _regenerator.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              if (this.isUsedHere()) {
                _context6.next = 16;
                break;
              }

              _context6.next = 3;
              return this.acquire();

            case 3:
              _context6.prev = 3;
              _context6.next = 6;
              return this.initialize(!!options.useEmptyPassphrase);

            case 6:
              _context6.next = 16;
              break;

            case 8:
              _context6.prev = 8;
              _context6.t0 = _context6["catch"](3);
              this.inconsistent = true;
              _context6.next = 13;
              return this.deferredActions[DEVICE.ACQUIRE].promise;

            case 13:
              this.runPromise = null;
              ERROR.INITIALIZATION_FAILED.message = "Initialize failed: " + _context6.t0.message;
              return _context6.abrupt("return", Promise.reject(ERROR.INITIALIZATION_FAILED));

            case 16:
              // if keepSession is set do not release device
              // until method with keepSession: false will be called
              if (options.keepSession) {
                this.keepSession = true;
              } // wait for event from trezor-link


              _context6.next = 19;
              return this.deferredActions[DEVICE.ACQUIRE].promise;

            case 19:
              if (!fn) {
                _context6.next = 22;
                break;
              }

              _context6.next = 22;
              return fn();

            case 22:
              if (!(this.features && !options.skipFinalReload)) {
                _context6.next = 25;
                break;
              }

              _context6.next = 25;
              return this.getFeatures();

            case 25:
              if (!(!this.keepSession && typeof options.keepSession !== 'boolean' || options.keepSession === false)) {
                _context6.next = 32;
                break;
              }

              this.keepSession = false;
              _context6.next = 29;
              return this.release();

            case 29:
              if (!this.deferredActions[DEVICE.RELEASE]) {
                _context6.next = 32;
                break;
              }

              _context6.next = 32;
              return this.deferredActions[DEVICE.RELEASE].promise;

            case 32:
              if (this.runPromise) {
                this.runPromise.resolve();
              }

              this.runPromise = null;
              this.loaded = true;
              this.firstRunPromise.resolve(true);

            case 36:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this, [[3, 8]]);
    }));

    function _runInner(_x6, _x7) {
      return _runInner2.apply(this, arguments);
    }

    return _runInner;
  }();

  _proto.getCommands = function getCommands() {
    return this.commands;
  };

  _proto.setInstance = function setInstance(instance) {
    if (this.instance !== instance) {
      // if requested instance is different than current
      // and device wasn't released in previous call (example: interrupted discovery which set "keepSession" to true but never released)
      // clear "keepSession" and reset "activitySessionID" to ensure that "initialize" will be called
      if (this.keepSession) {
        this.activitySessionID = null;
        this.keepSession = false;
      } // T1: forget cached passphrase


      if (this.isT1()) {
        this.clearPassphrase();
      }
    }

    this.instance = instance;
  };

  _proto.getInstance = function getInstance() {
    return this.instance;
  } // set expected state from method parameter
  ;

  _proto.setExpectedState = function setExpectedState(state) {
    if (!state) {
      this.setState(null); // T2 reset state

      this.setPassphrase(null); // T1 reset password
    }

    this.expectedState = state; // T2: set "temporaryState" the same as "expectedState", it may change if device will request for passphrase [after PassphraseStateRequest message]
    // this solves the issue with different instances but the same passphrases,
    // where device state passed in "initialize" is correct from device point of view
    // but "expectedState" and "temporaryState" are different strings

    if (!this.isT1()) {
      this.temporaryState = state;
    }
  };

  _proto.getExpectedState = function getExpectedState() {
    return this.expectedState;
  };

  _proto.setPassphrase = function setPassphrase(pass) {
    if (this.isT1()) {
      this.cachedPassphrase[this.instance] = pass;
    }
  };

  _proto.getPassphrase = function getPassphrase() {
    return this.cachedPassphrase[this.instance];
  };

  _proto.clearPassphrase = function clearPassphrase() {
    this.cachedPassphrase[this.instance] = null;
    this.keepSession = false;
  };

  _proto.initialize =
  /*#__PURE__*/
  function () {
    var _initialize = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee7(useEmptyPassphrase) {
      var _ref, message, currentFW;

      return _regenerator.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return this.commands.initialize(useEmptyPassphrase);

            case 2:
              _ref = _context7.sent;
              message = _ref.message;
              this.features = message;
              this.featuresNeedsReload = false;
              this.featuresTimestamp = new Date().getTime();
              currentFW = [this.features.major_version, this.features.minor_version, this.features.patch_version];
              this.firmwareStatus = (0, _FirmwareInfo.checkFirmware)(currentFW, this.features);
              this.firmwareRelease = (0, _FirmwareInfo.getLatestRelease)(currentFW);

            case 10:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, this);
    }));

    function initialize(_x8) {
      return _initialize.apply(this, arguments);
    }

    return initialize;
  }();

  _proto.getFeatures =
  /*#__PURE__*/
  function () {
    var _getFeatures = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee8() {
      var _ref2, message;

      return _regenerator.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return this.commands.typedCall('GetFeatures', 'Features', {});

            case 2:
              _ref2 = _context8.sent;
              message = _ref2.message;
              this.features = message;
              this.firmwareStatus = (0, _FirmwareInfo.checkFirmware)([this.features.major_version, this.features.minor_version, this.features.patch_version], this.features);

            case 6:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8, this);
    }));

    function getFeatures() {
      return _getFeatures.apply(this, arguments);
    }

    return getFeatures;
  }();

  _proto.getState = function getState() {
    return this.state ? this.state : null;
  };

  _proto.setState = function setState(state) {
    this.state = state;
  };

  _proto.setTemporaryState = function setTemporaryState(state) {
    this.temporaryState = state;
  };

  _proto.getTemporaryState = function getTemporaryState() {
    return this.temporaryState;
  };

  _proto.isUnacquired = function isUnacquired() {
    return this.features === undefined;
  };

  _proto.updateDescriptor =
  /*#__PURE__*/
  function () {
    var _updateDescriptor = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee9(upcomingDescriptor) {
      var originalSession, upcomingSession, methodStillRunning;
      return _regenerator.default.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              originalSession = this.originalDescriptor.session;
              upcomingSession = upcomingDescriptor.session;

              _log.debug('updateDescriptor', 'currentSession', originalSession, 'upcoming', upcomingSession, 'lastUsedID', this.activitySessionID);

              if (!(!originalSession && !upcomingSession && !this.activitySessionID)) {
                _context9.next = 5;
                break;
              }

              return _context9.abrupt("return");

            case 5:
              if (!this.deferredActions[DEVICE.ACQUIRED]) {
                _context9.next = 8;
                break;
              }

              _context9.next = 8;
              return this.deferredActions[DEVICE.ACQUIRED].promise;

            case 8:
              if (!upcomingSession) {
                // corner-case: if device was unacquired but some call to this device was made
                // this will automatically change unacquired device to acquired (without deviceList)
                // emit ACQUIRED event to deviceList which will propagate DEVICE.CONNECT event
                if (this.listeners(DEVICE.ACQUIRED).length > 0) {
                  this.emit(DEVICE.ACQUIRED);
                }
              }

              methodStillRunning = this.commands && !this.commands.disposed;

              if (!upcomingSession && !methodStillRunning) {
                // released
                if (originalSession === this.activitySessionID) {
                  // by myself
                  _log.debug('RELEASED BY MYSELF');

                  if (this.deferredActions[DEVICE.RELEASE]) {
                    this.deferredActions[DEVICE.RELEASE].resolve();
                    delete this.deferredActions[DEVICE.RELEASE];
                  }

                  this.activitySessionID = null;
                } else {
                  // by other application
                  _log.debug('RELEASED BY OTHER APP');

                  this.featuresNeedsReload = true;
                }

                this.keepSession = false;
              } else {
                // acquired
                // TODO: Case where listen event will dispatch before this.transport.acquire (this.acquire) return ID
                if (upcomingSession === this.activitySessionID) {
                  // by myself
                  _log.debug('ACQUIRED BY MYSELF');

                  if (this.deferredActions[DEVICE.ACQUIRE]) {
                    this.deferredActions[DEVICE.ACQUIRE].resolve(); // delete this.deferred[ DEVICE.ACQUIRE ];
                  }
                } else {
                  // by other application
                  _log.debug('ACQUIRED BY OTHER');

                  this.interruptionFromOutside();
                }
              }

              this.originalDescriptor = upcomingDescriptor;

            case 12:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9, this);
    }));

    function updateDescriptor(_x9) {
      return _updateDescriptor.apply(this, arguments);
    }

    return updateDescriptor;
  }();

  _proto.disconnect = function disconnect() {
    // TODO: cleanup everything
    _log.debug('DISCONNECT CLEANUP!'); // don't try to release


    delete this.deferredActions[DEVICE.RELEASE];
    this.interruptionFromUser(new Error('Device disconnected'));
    this.runPromise = null;
  };

  _proto.isBootloader = function isBootloader() {
    return this.features.bootloader_mode && typeof this.features.firmware_present === 'boolean' && this.features.firmware_present;
  };

  _proto.isInitialized = function isInitialized() {
    return this.features.initialized;
  };

  _proto.isSeedless = function isSeedless() {
    return this.features.no_backup;
  };

  _proto.isInconsistent = function isInconsistent() {
    return this.inconsistent;
  };

  _proto.getVersion = function getVersion() {
    return [this.features.major_version, this.features.minor_version, this.features.patch_version].join('.');
  };

  _proto.atLeast = function atLeast(versions) {
    var modelVersion = versions[this.features.major_version - 1];
    return (0, _semverCompare.default)(this.getVersion(), modelVersion) >= 0;
  };

  _proto.isUsed = function isUsed() {
    return typeof this.originalDescriptor.session === 'string';
  };

  _proto.isUsedHere = function isUsedHere() {
    return this.isUsed() && this.originalDescriptor.session === this.activitySessionID;
  };

  _proto.isUsedElsewhere = function isUsedElsewhere() {
    return this.isUsed() && !this.isUsedHere();
  };

  _proto.isRunning = function isRunning() {
    return !!this.runPromise;
  };

  _proto.isLoaded = function isLoaded() {
    return this.loaded;
  };

  _proto.waitForFirstRun = function waitForFirstRun() {
    return this.firstRunPromise.promise;
  };

  _proto.getDevicePath = function getDevicePath() {
    return this.originalDescriptor.path;
  };

  _proto.needAuthentication = function needAuthentication() {
    if (this.isUnacquired() || this.isUsedElsewhere() || this.featuresNeedsReload) return true;
    if (this.features.bootloader_mode || !this.features.initialized) return true;
    var pin = this.features.pin_protection ? this.features.pin_cached : true;
    var pass = this.features.passphrase_protection ? this.features.passphrase_cached : true;
    return pin && pass;
  };

  _proto.isT1 = function isT1() {
    return this.features ? this.features.major_version === 1 : false;
  };

  _proto.hasUnexpectedMode = function hasUnexpectedMode(allow) {
    if (this.features) {
      if (this.isBootloader() && !allow.includes(UI.BOOTLOADER)) {
        return UI.BOOTLOADER;
      }

      if (!this.isInitialized() && !allow.includes(UI.INITIALIZE)) {
        return UI.INITIALIZE;
      }

      if (this.isSeedless() && !allow.includes(UI.SEEDLESS)) {
        return UI.SEEDLESS;
      }
    }

    return null;
  };

  _proto.validateExpectedState = function validateExpectedState(state) {
    if (!this.isT1()) {
      var currentState = this.getExpectedState() || this.getState();

      if (!currentState) {
        this.setState(state);
        return true;
      } else if (currentState !== state) {
        return false;
      }
    } else if (this.getExpectedState() && this.getExpectedState() !== state) {
      return false;
    }

    return true;
  };

  _proto.onBeforeUnload = function onBeforeUnload() {
    if (this.isUsedHere() && this.activitySessionID) {
      try {
        this.transport.release(this.activitySessionID, true, false);
      } catch (err) {// empty
      }
    }
  };

  _proto.getMode = function getMode() {
    if (this.features.bootloader_mode) return 'bootloader';
    if (!this.features.initialized) return 'initialize';
    if (this.features.no_backup) return 'seedless';
    return 'normal';
  } // simplified object to pass via postMessage
  ;

  _proto.toMessageObject = function toMessageObject() {
    if (this.originalDescriptor.path === DEVICE.UNREADABLE) {
      return {
        type: 'unreadable',
        path: this.originalDescriptor.path,
        label: 'Unreadable device'
      };
    } else if (this.isUnacquired()) {
      return {
        type: 'unacquired',
        path: this.originalDescriptor.path,
        label: 'Unacquired device'
      };
    } else {
      var defaultLabel = 'My Trezor';
      var label = this.features.label === '' || this.features.label === null ? defaultLabel : this.features.label;
      return {
        type: 'acquired',
        path: this.originalDescriptor.path,
        label: label,
        state: this.state,
        status: this.isUsedElsewhere() ? 'occupied' : this.featuresNeedsReload ? 'used' : 'available',
        mode: this.getMode(),
        firmware: this.firmwareStatus,
        firmwareRelease: this.firmwareRelease,
        features: this.features
      };
    }
  };

  return Device;
}(_events.default);

exports.default = Device;