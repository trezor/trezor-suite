
/*global chrome:false*/
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.exists = exists;
exports.send = send;

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

function exists() {
  return new Promise(function ($return, $error) {
    if (typeof chrome === 'undefined') {
      return $error(new Error('Global chrome does not exist; probably not running chrome'));
    }
    if (typeof chrome.runtime === 'undefined') {
      return $error(new Error('Global chrome.runtime does not exist; probably not running chrome'));
    }
    if (typeof chrome.runtime.sendMessage === 'undefined') {
      return $error(new Error('Global chrome.runtime.sendMessage does not exist; probably not whitelisted website in extension manifest'));
    }
    return $return();
  }.$asyncbind(this));
}

function send(extensionId, message) {
  return new Promise(function (resolve, reject) {
    var callback = function callback(response) {
      if (response === undefined) {
        console.error('[trezor.js] [chrome-messages] Chrome runtime error', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      if (typeof response !== 'object' || response == null) {
        reject(new Error('Response is not an object.'));
        return;
      }
      if (response.type === 'response') {
        resolve(response.body);
      } else if (response.type === 'error') {
        console.error('[trezor.js] [chrome-messages] Error received', response);
        reject(new Error(response.message));
      } else {
        console.error('[trezor.js] [chrome-messages] Unknown response type ', response.type);
        reject(new Error('Unknown response type ' + response.type));
      }
    };

    if (chrome.runtime.id === extensionId) {
      // extension sending to itself
      // (only for including trezor.js in the management part of the extension)
      chrome.runtime.sendMessage(message, {}, callback);
    } else {
      // either another extension, or not sent from extension at all
      // (this will be run most probably)
      chrome.runtime.sendMessage(extensionId, message, {}, callback);
    }
  });
}