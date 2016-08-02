"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Handler = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _defered = require('../defered');

var _parse_protocol = require('../protobuf/parse_protocol');

var _verify = require('./verify');

var _send = require('./send');

var _receive = require('./receive');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// eslint-disable-next-line quotes
var stringify = require('json-stable-stringify');

function parseAcquireInput(input) {
  // eslint-disable-next-line quotes
  if (typeof input !== 'string') {
    var _path = input.path.toString();
    var _previous = input.previous == null ? null : input.previous.toString();
    return {
      path: _path,
      previous: _previous,
      checkPrevious: true
    };
  } else {
    var _path2 = input.toString();
    return {
      path: _path2,
      previous: null,
      checkPrevious: false
    };
  }
}

function compare(a, b) {
  if (!isNaN(a.path)) {
    return parseInt(a.path) - parseInt(b.path);
  } else {
    return a.path < a.path ? -1 : a.path > a.path ? 1 : 0;
  }
}

function timeoutPromise(delay) {
  return new Promise(function (resolve) {
    window.setTimeout(function () {
      return resolve();
    }, delay);
  });
}

var ITER_MAX = 60;
var ITER_DELAY = 500;

var Handler = exports.Handler = function () {

  // session => path


  // path => promise rejecting on release
  function Handler(transport) {
    _classCallCheck(this, Handler);

    this._lock = Promise.resolve();
    this.deferedOnRelease = {};
    this.connections = {};
    this.reverse = {};
    this._lastStringified = '';

    this.transport = transport;
  }

  // path => session


  _createClass(Handler, [{
    key: 'lock',
    value: function lock(fn) {
      var res = this._lock.then(function () {
        return fn();
      });
      this._lock = res.catch(function () {});
      return res;
    }
  }, {
    key: 'enumerate',
    value: function enumerate() {
      var _this = this;

      return this.lock(function () {
        return _this.transport.enumerate().then(function (devices) {
          return devices.map(function (device) {
            return _extends({}, device, {
              session: _this.connections[device.path]
            });
          });
        }).then(function (devices) {
          _this._releaseDisconnected(devices);
          return devices;
        }).then(function (devices) {
          return devices.sort(compare);
        });
      });
    }
  }, {
    key: '_releaseDisconnected',
    value: function _releaseDisconnected(devices) {}
  }, {
    key: 'listen',
    value: function listen(old) {
      var oldStringified = stringify(old);
      var last = old == null ? this._lastStringified : oldStringified;
      return this._runIter(0, last);
    }
  }, {
    key: '_runIter',
    value: function _runIter(iteration, oldStringified) {
      var _this2 = this;

      return this.enumerate().then(function (devices) {
        var stringified = stringify(devices);
        if (stringified !== oldStringified || iteration === ITER_MAX) {
          _this2._lastStringified = stringified;
          return devices;
        }
        return timeoutPromise(ITER_DELAY).then(function () {
          return _this2._runIter(iteration + 1, stringified);
        });
      });
    }
  }, {
    key: '_checkAndReleaseBeforeAcquire',
    value: function _checkAndReleaseBeforeAcquire(parsed) {
      var realPrevious = this.connections[parsed.path];
      if (parsed.checkPrevious) {
        var error = false;
        if (realPrevious == null) {
          error = parsed.previous != null;
        } else {
          error = parsed.previous !== realPrevious;
        }
        if (error) {
          throw new Error('wrong previous session');
        }
      }
      if (realPrevious != null) {
        var releasePromise = this._realRelease(parsed.path, realPrevious);
        return releasePromise;
      } else {
        return Promise.resolve();
      }
    }
  }, {
    key: 'acquire',
    value: function acquire(input) {
      var _this3 = this;

      var parsed = parseAcquireInput(input);
      return this.lock(function () {
        return _this3._checkAndReleaseBeforeAcquire(parsed).then(function () {
          return _this3.transport.connect(parsed.path);
        }).then(function (session) {
          _this3.connections[parsed.path] = session;
          _this3.reverse[session] = parsed.path;
          _this3.deferedOnRelease[parsed.path] = (0, _defered.create)();
          return session;
        });
      });
    }
  }, {
    key: 'release',
    value: function release(session) {
      var _this4 = this;

      var path = this.reverse[session];
      return this.lock(function () {
        return _this4._realRelease(path, session);
      });
    }
  }, {
    key: '_realRelease',
    value: function _realRelease(path, session) {
      var _this5 = this;

      return this.transport.disconnect(path, session).then(function () {
        _this5._releaseCleanup(session);
      });
    }
  }, {
    key: '_releaseCleanup',
    value: function _releaseCleanup(session) {
      var path = this.reverse[session];
      delete this.reverse[session];
      delete this.connections[path];
      this.deferedOnRelease[path].reject(new Error('Device released or disconnected'));
      return;
    }
  }, {
    key: 'configure',
    value: function configure(signedData) {
      try {
        var buffer = (0, _verify.verifyHexBin)(signedData);
        var messages = (0, _parse_protocol.parseConfigure)(buffer);
        this._messages = messages;
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    }
  }, {
    key: '_sendTransport',
    value: function _sendTransport(session) {
      var _this6 = this;

      var path = this.reverse[session];
      return function (data) {
        return _this6.transport.send(path, session, data);
      };
    }
  }, {
    key: '_receiveTransport',
    value: function _receiveTransport(session) {
      var _this7 = this;

      var path = this.reverse[session];
      return function () {
        return _this7.transport.receive(path, session);
      };
    }
  }, {
    key: 'call',
    value: function call(session, name, data) {
      var _this8 = this;

      if (this._messages == null) {
        return Promise.reject(new Error('Handler not configured.'));
      }
      var messages = this._messages;
      return (0, _send.buildAndSend)(messages, this._sendTransport(session), name, data).then(function () {
        return (0, _receive.receiveAndParse)(messages, _this8._receiveTransport(session));
      });
    }
  }, {
    key: 'hasMessages',
    value: function hasMessages() {
      if (this._messages == null) {
        return Promise.resolve(false);
      } else {
        return Promise.resolve(true);
      }
    }
  }]);

  return Handler;
}();