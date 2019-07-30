'use strict'; // This file reads descriptor with very little logic, and sends it to layers above

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _events = _interopRequireDefault(require("events"));

var TRANSPORT = _interopRequireWildcard(require("../constants/transport"));

var DEVICE = _interopRequireWildcard(require("../constants/device"));

var _debug = _interopRequireWildcard(require("../utils/debug"));

var _DataManager = _interopRequireDefault(require("../data/DataManager"));

var _promiseUtils = require("../utils/promiseUtils");

// custom log
var logger = (0, _debug.init)('DescriptorStream');

var DescriptorStream =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inheritsLoose2.default)(DescriptorStream, _EventEmitter);

  // actual low-level transport, from trezor-link
  // if the transport works
  // if transport fetch API rejects (when computer goes to sleep)
  // null if nothing
  function DescriptorStream(transport) {
    var _this;

    _this = _EventEmitter.call(this) || this;
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "listening", false);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "listenTimestamp", 0);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "current", null);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "upcoming", []);
    _this.transport = transport;
    logger.enabled = _DataManager.default.getSettings('debug');
    return _this;
  } // emits changes


  var _proto = DescriptorStream.prototype;

  _proto.listen =
  /*#__PURE__*/
  function () {
    var _listen = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var waitForEvent, current, descriptors, time;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              // if we are not enumerating for the first time, we can let
              waitForEvent = this.current !== null;
              current = this.current || [];
              this.listening = true;
              _context.prev = 3;
              logger.debug('Start listening', current);
              this.listenTimestamp = new Date().getTime();

              if (!waitForEvent) {
                _context.next = 12;
                break;
              }

              _context.next = 9;
              return this.transport.listen(current);

            case 9:
              _context.t0 = _context.sent;
              _context.next = 15;
              break;

            case 12:
              _context.next = 14;
              return this.transport.enumerate();

            case 14:
              _context.t0 = _context.sent;

            case 15:
              descriptors = _context.t0;

              if (this.listening && !waitForEvent) {
                // enumerate returns some value
                // TRANSPORT.START will be emitted from DeviceList after device will be available (either acquired or unacquired)
                if (descriptors.length > 0 && _DataManager.default.getSettings('pendingTransportEvent')) {
                  this.emit(TRANSPORT.START_PENDING);
                } else {
                  this.emit(TRANSPORT.START);
                }
              }

              if (this.listening) {
                _context.next = 19;
                break;
              }

              return _context.abrupt("return");

            case 19:
              // do not continue if stop() was called
              this.upcoming = descriptors;
              logger.debug('Listen result', descriptors);

              this._reportChanges();

              if (this.listening) this.listen(); // handlers might have called stop()

              _context.next = 37;
              break;

            case 25:
              _context.prev = 25;
              _context.t1 = _context["catch"](3);
              time = new Date().getTime() - this.listenTimestamp;
              logger.debug('Listen error', 'timestamp', time, typeof _context.t1);

              if (!(time > 1100)) {
                _context.next = 35;
                break;
              }

              _context.next = 32;
              return (0, _promiseUtils.resolveAfter)(1000, null);

            case 32:
              if (this.listening) this.listen();
              _context.next = 37;
              break;

            case 35:
              logger.log('Transport error');
              this.emit(TRANSPORT.ERROR, _context.t1);

            case 37:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this, [[3, 25]]);
    }));

    function listen() {
      return _listen.apply(this, arguments);
    }

    return listen;
  }();

  _proto.enumerate =
  /*#__PURE__*/
  function () {
    var _enumerate = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (this.listening) {
                _context2.next = 2;
                break;
              }

              return _context2.abrupt("return");

            case 2:
              _context2.prev = 2;
              _context2.next = 5;
              return this.transport.enumerate();

            case 5:
              this.upcoming = _context2.sent;

              this._reportChanges();

              _context2.next = 11;
              break;

            case 9:
              _context2.prev = 9;
              _context2.t0 = _context2["catch"](2);

            case 11:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[2, 9]]);
    }));

    function enumerate() {
      return _enumerate.apply(this, arguments);
    }

    return enumerate;
  }();

  _proto.stop = function stop() {
    this.listening = false;
  };

  _proto._diff = function _diff(currentN, descriptors) {
    var current = currentN || [];
    var connected = descriptors.filter(function (d) {
      return current.find(function (x) {
        return x.path === d.path;
      }) === undefined;
    });
    var disconnected = current.filter(function (d) {
      return descriptors.find(function (x) {
        return x.path === d.path;
      }) === undefined;
    });
    var changedSessions = descriptors.filter(function (d) {
      var currentDescriptor = current.find(function (x) {
        return x.path === d.path;
      });

      if (currentDescriptor) {
        // return currentDescriptor.debug ? (currentDescriptor.debugSession !== d.debugSession) : (currentDescriptor.session !== d.session);
        return currentDescriptor.session !== d.session;
      } else {
        return false;
      }
    });
    var acquired = changedSessions.filter(function (d) {
      return typeof d.session === 'string';
    });
    var released = changedSessions.filter(function (d) {
      // const session = descriptor.debug ? descriptor.debugSession : descriptor.session;
      return typeof d.session !== 'string';
    });
    var changedDebugSessions = descriptors.filter(function (d) {
      var currentDescriptor = current.find(function (x) {
        return x.path === d.path;
      });

      if (currentDescriptor) {
        return currentDescriptor.debugSession !== d.debugSession;
      } else {
        return false;
      }
    });
    var debugAcquired = changedSessions.filter(function (d) {
      return typeof d.debugSession === 'string';
    });
    var debugReleased = changedSessions.filter(function (d) {
      return typeof d.debugSession !== 'string';
    });
    var didUpdate = connected.length + disconnected.length + changedSessions.length + changedDebugSessions.length > 0;
    return {
      connected: connected,
      disconnected: disconnected,
      changedSessions: changedSessions,
      acquired: acquired,
      released: released,
      changedDebugSessions: changedDebugSessions,
      debugAcquired: debugAcquired,
      debugReleased: debugReleased,
      didUpdate: didUpdate,
      descriptors: descriptors
    };
  };

  _proto._reportChanges = function _reportChanges() {
    var _this2 = this;

    var diff = this._diff(this.current, this.upcoming);

    this.current = this.upcoming;

    if (diff.didUpdate && this.listening) {
      diff.connected.forEach(function (d) {
        _this2.emit(DEVICE.CONNECT, d);
      });
      diff.disconnected.forEach(function (d) {
        _this2.emit(DEVICE.DISCONNECT, d);
      });
      diff.acquired.forEach(function (d) {
        _this2.emit(DEVICE.ACQUIRED, d);
      });
      diff.released.forEach(function (d) {
        _this2.emit(DEVICE.RELEASED, d);
      });
      diff.changedSessions.forEach(function (d) {
        _this2.emit(DEVICE.CHANGED, d);
      });
      this.emit(TRANSPORT.UPDATE, diff);
    }
  };

  return DescriptorStream;
}(_events.default);

exports.default = DescriptorStream;