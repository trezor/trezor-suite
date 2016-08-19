'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

class FallbackTransport {

  constructor(transports) {
    this.transports = transports;
  }

  // first one that inits successfuly is the final one; others won't even start initing


  // note: activeTransport is actually "?Transport", but
  // everywhere I am using it is in `async`, so error gets returned as Promise.reject
  _tryTransports() {
    return new Promise(function ($return, $error) {
      var transport, transportObj, $iterator_transportObj;
      let lastError;
      lastError = null;
      $iterator_transportObj = [this.transports[Symbol.iterator]()];
      return function $ForStatement_2_loop($ForStatement_2_exit, $error) {
        function $ForStatement_2_next() {
          return $ForStatement_2_loop($ForStatement_2_exit, $error);
        }

        if (!($iterator_transportObj[1] = $iterator_transportObj[0].next()).done && ((transportObj = $iterator_transportObj[1].value) || true)) {
          transport = transportObj.transport;

          function $Try_1_Post() {
            return void $ForStatement_2_next.call(this);
          }

          var $Try_1_Catch = function (e) {
            lastError = e;
            // ...
            $Try_1_Post.call(this)
          }.$asyncbind(this, $error);

          try {
            return transport.init().then(function ($await_4) {
              return $return(transport);
            }.$asyncbind(this, $Try_1_Catch), $Try_1_Catch);
          } catch (e) {
            $Try_1_Catch(e)
          }
        } else return void $ForStatement_2_exit();
      }.$asyncbind(this).then(function ($await_5) {
        return $error(lastError || new Error(`No transport could be initialized.`));
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  init() {
    return new Promise(function ($return, $error) {
      var transport;
      return this._tryTransports().then(function ($await_6) {
        transport = $await_6;

        this.activeTransport = transport;
        this.version = this.activeTransport.version;
        this.configured = this.activeTransport.configured;
        return $return();
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  // using async so I get Promise.recect on this.activeTransport == null (or other error), not Error
  enumerate() {
    return new Promise(function ($return, $error) {
      return $return(this.activeTransport.enumerate());
    }.$asyncbind(this));
  }

  listen(old) {
    return new Promise(function ($return, $error) {
      return $return(this.activeTransport.listen(old));
    }.$asyncbind(this));
  }

  acquire(input) {
    return new Promise(function ($return, $error) {
      return $return(this.activeTransport.acquire(input));
    }.$asyncbind(this));
  }

  release(session) {
    return new Promise(function ($return, $error) {
      return $return(this.activeTransport.release(session));
    }.$asyncbind(this));
  }

  configure(signedData) {
    return new Promise(function ($return, $error) {
      return this.activeTransport.configure(signedData).then(function ($await_7) {
        this.configured = this.activeTransport.configured;
        return $return();
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  call(session, name, data) {
    return new Promise(function ($return, $error) {
      return $return(this.activeTransport.call(session, name, data));
    }.$asyncbind(this));
  }

}
exports.FallbackTransport = FallbackTransport;