'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class;

var _monkey_patch = require('./protobuf/monkey_patch');

var _defered = require('../defered');

var _parse_protocol = require('./protobuf/parse_protocol');

var _verify = require('./verify');

var _send = require('./send');

var _receive = require('./receive');

var _debugDecorator = require('../debug-decorator');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

Function.prototype.$asyncbind = function $asyncbind(self, catcher) {
  var resolver = this;

  if (catcher === true) {
    if (!Function.prototype.$asyncbind.EagerThenable) Function.prototype.$asyncbind.EagerThenable = function factory(tick) {
      var _tasks = [];

      if (!tick) {
        try {
          tick = process.nextTick;
        } catch (ex) {
          tick = function tick(p) {
            setTimeout(p, 0);
          };
        }
      }

      function _untask() {
        for (var i = 0; i < _tasks.length; i += 2) {
          var t = _tasks[i + 1],
              r = _tasks[i];

          for (var j = 0; j < t.length; j++) {
            t[j].call(null, r);
          }
        }

        _tasks = [];
      }

      function isThenable(obj) {
        return obj && obj instanceof Object && typeof obj.then === 'function';
      }

      function EagerThenable(resolver) {
        function done(inline) {
          var w;
          if (_sync || phase < 0 || (w = _thens[phase]).length === 0) return;

          _tasks.push(result, w);

          _thens = [[], []];
          if (_tasks.length === 2) inline ? _untask() : tick(_untask);
        }

        function resolveThen(x) {
          if (isThenable(x)) return x.then(resolveThen, rejectThen);
          phase = 0;
          result = x;
          done(true);
        }

        function rejectThen(x) {
          if (isThenable(x)) return x.then(resolveThen, rejectThen);
          phase = 1;
          result = x;
          done(true);
        }

        function settler(resolver, rejecter) {
          _thens[0].push(resolver);

          _thens[1].push(rejecter);

          done();
        }

        function toString() {
          return 'EagerThenable{' + {
            '-1': 'pending',
            0: 'resolved',
            1: 'rejected'
          }[phase] + '}=' + result.toString();
        }

        this.then = settler;
        this.toString = toString;
        var _thens = [[], []],
            _sync = true,
            phase = -1,
            result;
        resolver.call(null, resolveThen, rejectThen);
        _sync = false;
        done();
      }

      EagerThenable.resolve = function (v) {
        return isThenable(v) ? v : {
          then: function then(resolve, reject) {
            return resolve(v);
          }
        };
      };

      return EagerThenable;
    }();
    return new Function.prototype.$asyncbind.EagerThenable(boundThen);
  }

  if (catcher) {
    if (Function.prototype.$asyncbind.wrapAsyncStack) catcher = Function.prototype.$asyncbind.wrapAsyncStack(catcher);
    return then;
  }

  function then(result, error) {
    try {
      return result && result instanceof Object && typeof result.then === 'function' ? result.then(then, catcher) : resolver.call(self, result, error || catcher);
    } catch (ex) {
      return (error || catcher)(ex);
    }
  }

  function boundThen(result, error) {
    return resolver.call(self, result, error);
  }

  boundThen.then = boundThen;
  return boundThen;
};

var stringify, ITER_MAX, ITER_DELAY;


function stableStringify(devices) {
  if (devices == null) {
    return 'null';
  }

  var pureDevices = devices.map(function (device) {
    var path = device.path;
    var session = device.session == null ? null : device.session;
    return { path: path, session: session };
  });

  return stringify(pureDevices);
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
    setTimeout(function () {
      return resolve();
    }, delay);
  });
}

(0, _monkey_patch.patch)();

// eslint-disable-next-line quotes
stringify = require('json-stable-stringify');
ITER_MAX = 60;
ITER_DELAY = 500;
var LowlevelTransport = (_class = function () {

  // session => path


  // path => promise rejecting on release
  function LowlevelTransport(plugin) {
    _classCallCheck(this, LowlevelTransport);

    this.name = 'LowlevelTransport';
    this._lock = Promise.resolve();
    this.debug = false;
    this.deferedOnRelease = {};
    this.connections = {};
    this.reverse = {};
    this.configured = false;
    this._lastStringified = '';

    this.plugin = plugin;
    this.version = plugin.version;
  }

  // path => session


  _createClass(LowlevelTransport, [{
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
      return this._silentEnumerate();
    }
  }, {
    key: '_silentEnumerate',
    value: function _silentEnumerate() {
      var _this2 = this;

      return this.lock(function () {
        return new Promise(function ($return, $error) {
          var devices, devicesWithSessions;
          return this.plugin.enumerate().then(function ($await_2) {
            var _this = this;

            devices = $await_2;
            devicesWithSessions = devices.map(function (device) {
              return _extends({}, device, {
                session: _this.connections[device.path]
              });
            });

            this._releaseDisconnected(devicesWithSessions);
            return $return(devicesWithSessions.sort(compare));
          }.$asyncbind(this, $error), $error);
        }.$asyncbind(_this2));
      });
    }
  }, {
    key: '_releaseDisconnected',
    value: function _releaseDisconnected(devices) {
      var _this3 = this;

      var connected = {};
      devices.forEach(function (device) {
        connected[device.path] = true;
      });
      Object.keys(this.connections).forEach(function (path) {
        if (connected[path] == null) {
          if (_this3.connections[path] != null) {
            _this3._releaseCleanup(_this3.connections[path]);
          }
        }
      });
    }
  }, {
    key: 'listen',
    value: function listen(old) {
      return new Promise(function ($return, $error) {
        var oldStringified = stableStringify(old);
        var last = old == null ? this._lastStringified : oldStringified;
        return $return(this._runIter(0, last));
      }.$asyncbind(this));
    }
  }, {
    key: '_runIter',
    value: function _runIter(iteration, oldStringified) {
      return new Promise(function ($return, $error) {
        var devices, stringified;
        return this._silentEnumerate().then(function ($await_3) {
          devices = $await_3;
          stringified = stableStringify(devices);

          if (stringified !== oldStringified || iteration === ITER_MAX) {
            this._lastStringified = stringified;
            return $return(devices);
          }
          return timeoutPromise(ITER_DELAY).then(function ($await_4) {
            return $return(this._runIter(iteration + 1, stringified));
          }.$asyncbind(this, $error), $error);
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }, {
    key: '_checkAndReleaseBeforeAcquire',
    value: function _checkAndReleaseBeforeAcquire(input) {
      return new Promise(function ($return, $error) {
        var realPrevious;
        realPrevious = this.connections[input.path];

        if (input.checkPrevious) {
          var error = false;
          if (realPrevious == null) {
            error = input.previous != null;
          } else {
            error = input.previous !== realPrevious;
          }
          if (error) {
            return $error(new Error('wrong previous session'));
          }
        }

        function $IfStatement_1() {
          return $return();
        }

        if (realPrevious != null) {
          return this._realRelease(input.path, realPrevious).then(function ($await_5) {
            return $IfStatement_1.call(this);
          }.$asyncbind(this, $error), $error);
        }
        return $IfStatement_1.call(this);
      }.$asyncbind(this));
    }
  }, {
    key: 'acquire',
    value: function acquire(input) {
      return new Promise(function ($return, $error) {
        var _this4 = this;

        return $return(this.lock(function () {
          return new Promise(function ($return, $error) {
            var session;
            return this._checkAndReleaseBeforeAcquire(input).then(function ($await_6) {
              return this.plugin.connect(input.path).then(function ($await_7) {
                session = $await_7;

                this.connections[input.path] = session;
                this.reverse[session] = input.path;
                this.deferedOnRelease[session] = (0, _defered.create)();
                return $return(session);
              }.$asyncbind(this, $error), $error);
            }.$asyncbind(this, $error), $error);
          }.$asyncbind(_this4));
        }));
      }.$asyncbind(this));
    }
  }, {
    key: 'release',
    value: function release(session) {
      return new Promise(function ($return, $error) {
        var _this5 = this;

        var path = this.reverse[session];
        if (path == null) {
          return $error(new Error('Trying to double release.'));
        }
        return $return(this.lock(function () {
          return _this5._realRelease(path, session);
        }));
      }.$asyncbind(this));
    }
  }, {
    key: '_realRelease',
    value: function _realRelease(path, session) {
      return new Promise(function ($return, $error) {
        return this.plugin.disconnect(path, session).then(function ($await_8) {
          this._releaseCleanup(session);
          return $return();
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }, {
    key: '_releaseCleanup',
    value: function _releaseCleanup(session) {
      var path = this.reverse[session];
      delete this.reverse[session];
      delete this.connections[path];
      this.deferedOnRelease[session].reject(new Error('Device released or disconnected'));
      delete this.deferedOnRelease[session];
      return;
    }
  }, {
    key: 'configure',
    value: function configure(signedData) {
      return new Promise(function ($return, $error) {
        var buffer = (0, _verify.verifyHexBin)(signedData);
        var messages = (0, _parse_protocol.parseConfigure)(buffer);
        this._messages = messages;
        this.configured = true;
        return $return();
      }.$asyncbind(this));
    }
  }, {
    key: '_sendLowlevel',
    value: function _sendLowlevel(session) {
      var _this6 = this;

      var path = this.reverse[session];
      return function (data) {
        return _this6.plugin.send(path, session, data);
      };
    }
  }, {
    key: '_receiveLowlevel',
    value: function _receiveLowlevel(session) {
      var _this7 = this;

      var path = this.reverse[session];
      return function () {
        return _this7.plugin.receive(path, session);
      };
    }
  }, {
    key: 'call',
    value: function call(session, name, data) {
      return new Promise(function ($return, $error) {
        var _this9 = this;

        if (this._messages == null) {
          return $error(new Error('Transport not configured.'));
        }
        if (this.reverse[session] == null) {
          return $error(new Error('Trying to use device after release.'));
        }

        var messages = this._messages;

        return $return(this.lock(function () {
          return new Promise(function ($return, $error) {
            var _this8 = this;

            var resPromise = function () {
              return new Promise(function ($return, $error) {
                var message;
                return (0, _send.buildAndSend)(messages, this._sendLowlevel(session), name, data).then(function ($await_9) {
                  return (0, _receive.receiveAndParse)(messages, this._receiveLowlevel(session)).then(function ($await_10) {
                    message = $await_10;

                    return $return(message);
                  }.$asyncbind(this, $error), $error);
                }.$asyncbind(this, $error), $error);
              }.$asyncbind(_this8));
            }();

            return $return(Promise.race([this.deferedOnRelease[session].rejectingPromise, resPromise]));
          }.$asyncbind(_this9));
        }));
      }.$asyncbind(this));
    }
  }, {
    key: 'init',
    value: function init(debug) {
      return new Promise(function ($return, $error) {
        this.debug = !!debug;
        return $return(this.plugin.init(debug));
      }.$asyncbind(this));
    }
  }]);

  return LowlevelTransport;
}(), (_applyDecoratedDescriptor(_class.prototype, 'enumerate', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'enumerate'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'listen', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'listen'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'acquire', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'acquire'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'release', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'release'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'configure', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'configure'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'call', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'call'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'init', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'init'), _class.prototype)), _class);
exports.default = LowlevelTransport;
module.exports = exports['default'];