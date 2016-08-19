"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LowlevelTransport = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _monkey_patch = require('./protobuf/monkey_patch');

var _defered = require('../defered');

var _parse_protocol = require('./protobuf/parse_protocol');

var _verify = require('./verify');

var _send = require('./send');

var _receive = require('./receive');

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

          for (var j = 0; j < t.length; j++) t[j].call(null, r);
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
    return `null`;
  }

  const pureDevices = devices.map(device => {
    const path = device.path;
    const session = device.session == null ? null : device.session;
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
  return new Promise(resolve => {
    window.setTimeout(() => resolve(), delay);
  });
}

(0, _monkey_patch.patch)();

// eslint-disable-next-line quotes
stringify = require('json-stable-stringify');
ITER_MAX = 60;
ITER_DELAY = 500;
class LowlevelTransport {

  // session => path


  // path => promise rejecting on release
  constructor(plugin) {
    this._lock = Promise.resolve();
    this.deferedOnRelease = {};
    this.connections = {};
    this.reverse = {};
    this.configured = false;
    this._lastStringified = ``;

    this.plugin = plugin;
    this.version = plugin.version;
  }

  // path => session


  lock(fn) {
    const res = this._lock.then(() => fn());
    this._lock = res.catch(() => {});
    return res;
  }

  enumerate() {
    return this.lock(() => {
      return new Promise(function ($return, $error) {
        var devices, devicesWithSessions;
        return this.plugin.enumerate().then(function ($await_2) {
          devices = $await_2;
          devicesWithSessions = devices.map(device => {
            return _extends({}, device, {
              session: this.connections[device.path]
            });
          });

          this._releaseDisconnected(devicesWithSessions);
          return $return(devicesWithSessions.sort(compare));
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    });
  }

  _releaseDisconnected(devices) {
    const connected = {};
    devices.forEach(device => {
      connected[device.path] = true;
    });
    Object.keys(this.connections).forEach(path => {
      if (connected[path] == null) {
        if (this.connections[path] != null) {
          this._releaseCleanup(this.connections[path]);
        }
      }
    });
  }

  listen(old) {
    return new Promise(function ($return, $error) {
      const oldStringified = stableStringify(old);
      const last = old == null ? this._lastStringified : oldStringified;
      return $return(this._runIter(0, last));
    }.$asyncbind(this));
  }

  _runIter(iteration, oldStringified) {
    return new Promise(function ($return, $error) {
      var devices, stringified;
      return this.enumerate().then(function ($await_3) {
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

  _checkAndReleaseBeforeAcquire(input) {
    return new Promise(function ($return, $error) {
      var realPrevious;
      realPrevious = this.connections[input.path];

      if (input.checkPrevious) {
        let error = false;
        if (realPrevious == null) {
          error = input.previous != null;
        } else {
          error = input.previous !== realPrevious;
        }
        if (error) {
          return $error(new Error(`wrong previous session`));
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

  acquire(input) {
    return new Promise(function ($return, $error) {
      return $return(this.lock(() => {
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
        }.$asyncbind(this));
      }));
    }.$asyncbind(this));
  }

  release(session) {
    return new Promise(function ($return, $error) {
      const path = this.reverse[session];
      if (path == null) {
        return $error(new Error(`Trying to double release.`));
      }
      return $return(this.lock(() => this._realRelease(path, session)));
    }.$asyncbind(this));
  }

  _realRelease(path, session) {
    return new Promise(function ($return, $error) {
      return this.plugin.disconnect(path, session).then(function ($await_8) {
        this._releaseCleanup(session);
        return $return();
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  _releaseCleanup(session) {
    const path = this.reverse[session];
    delete this.reverse[session];
    delete this.connections[path];
    this.deferedOnRelease[session].reject(new Error(`Device released or disconnected`));
    delete this.deferedOnRelease[session];
    return;
  }

  configure(signedData) {
    return new Promise(function ($return, $error) {
      const buffer = (0, _verify.verifyHexBin)(signedData);
      const messages = (0, _parse_protocol.parseConfigure)(buffer);
      this._messages = messages;
      this.configured = true;
      return $return();
    }.$asyncbind(this));
  }

  _sendLowlevel(session) {
    const path = this.reverse[session];
    return data => this.plugin.send(path, session, data);
  }

  _receiveLowlevel(session) {
    const path = this.reverse[session];
    return () => this.plugin.receive(path, session);
  }

  call(session, name, data) {
    return new Promise(function ($return, $error) {
      if (this._messages == null) {
        return $error(new Error(`Transport not configured.`));
      }
      if (this.reverse[session] == null) {
        return $error(new Error(`Trying to use device after release.`));
      }

      const messages = this._messages;
      const resPromise = (() => {
        return new Promise(function ($return, $error) {
          var message;
          return (0, _send.buildAndSend)(messages, this._sendLowlevel(session), name, data).then(function ($await_9) {
            return (0, _receive.receiveAndParse)(messages, this._receiveLowlevel(session)).then(function ($await_10) {
              message = $await_10;

              return $return(message);
            }.$asyncbind(this, $error), $error);
          }.$asyncbind(this, $error), $error);
        }.$asyncbind(this));
      })();

      return $return(Promise.race([this.deferedOnRelease[session].rejectingPromise, resPromise]));
    }.$asyncbind(this));
  }

  init() {
    return new Promise(function ($return, $error) {
      return $return(this.plugin.init());
    }.$asyncbind(this));
  }
}
exports.LowlevelTransport = LowlevelTransport;