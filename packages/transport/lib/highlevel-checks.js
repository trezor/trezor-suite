'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.info = info;
exports.version = version;
exports.devices = devices;
exports.acquire = acquire;
exports.call = call;

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

// input checks for high-level transports

function info(res) {
  if (typeof res !== 'object' || res == null) {
    throw new Error('Wrong result type.');
  }
  var version = res.version;
  if (typeof version !== 'string') {
    throw new Error('Wrong result type.');
  }
  var configured = !!res.configured;
  return { version: version, configured: configured };
}

function version(version) {
  if (typeof version !== 'string') {
    throw new Error('Wrong result type.');
  }
  return version.trim();
}

function devices(res) {
  if (typeof res !== 'object') {
    throw new Error('Wrong result type.');
  }
  if (!(res instanceof Array)) {
    throw new Error('Wrong result type.');
  }
  return res.map(function (o) {
    if (typeof o !== 'object' || o == null) {
      throw new Error('Wrong result type.');
    }
    var path = o.path;
    if (typeof path !== 'number' && typeof path !== 'string') {
      throw new Error('Wrong result type.');
    }
    var pathS = path.toString();
    var session = o.session;
    if (session == null) {
      return {
        path: pathS,
        session: null
      };
    } else {
      if (typeof session !== 'number' && typeof session !== 'string') {
        throw new Error('Wrong result type.');
      }
      return {
        path: pathS,
        session: session.toString()
      };
    }
  });
}

function acquire(res) {
  if (typeof res !== 'object' || res == null) {
    throw new Error('Wrong result type.');
  }
  var session = res.session;
  if (typeof session !== 'string' && typeof session !== 'number') {
    throw new Error('Wrong result type.');
  }
  return session.toString();
}

function call(res) {
  if (typeof res !== 'object' || res == null) {
    throw new Error('Wrong result type.');
  }
  var type = res.type;
  if (typeof type !== 'string') {
    throw new Error('Wrong result type.');
  }
  var message = res.message;
  if (typeof message !== 'object' || message == null) {
    throw new Error('Wrong result type.');
  }
  return { type: type, message: message };
}