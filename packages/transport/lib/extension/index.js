'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _desc, _value, _class;

var _messages = require('./messages');

var messages = _interopRequireWildcard(_messages);

var _highlevelChecks = require('../highlevel-checks');

var check = _interopRequireWildcard(_highlevelChecks);

var _debugDecorator = require('../debug-decorator');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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

var EXTENSION_ID;
EXTENSION_ID = `jcjjhjgimijdkoamemaghajlhegmoclj`;
let ChromeExtensionTransport = (_class = class ChromeExtensionTransport {

  constructor(id) {
    this.version = ``;
    this.configured = false;
    this.showUdevError = false;
    this.debug = false;

    this.id = id == null ? EXTENSION_ID : id;
  }

  _send(message) {
    return new Promise(function ($return, $error) {
      var res, udev;
      return messages.send(this.id, message).then(function ($await_1) {
        res = $await_1;
        return messages.send(this.id, { type: `udevStatus` }).then(function ($await_2) {
          udev = $await_2;

          this.showUdevError = udev === `display`;
          return $return(res);
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  ping() {
    return new Promise(function ($return, $error) {
      var res;
      return this._send({ type: `ping` }).then(function ($await_3) {
        res = $await_3;

        if (res !== `pong`) {
          return $error(new Error(`Response to "ping" should be "pong".`));
        }
        return $return();
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  info() {
    return new Promise(function ($return, $error) {
      var infoS;
      return this._send({ type: `info` }).then(function ($await_4) {
        infoS = $await_4;

        return $return(check.info(infoS));
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  init(debug) {
    return new Promise(function ($return, $error) {
      this.debug = !!debug;
      return this._silentInit().then(function ($await_5) {
        return $return();
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  _silentInit() {
    return new Promise(function ($return, $error) {
      var info;
      return messages.exists().then(function ($await_6) {
        return this.ping().then(function ($await_7) {
          return this.info().then(function ($await_8) {
            info = $await_8;

            this.version = info.version;
            this.configured = info.configured;
            return $return();
          }.$asyncbind(this, $error), $error);
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  configure(config) {
    return new Promise(function ($return, $error) {
      return this._send({
        type: `configure`,
        body: config
      }).then(function ($await_9) {
        return this._silentInit().then(function ($await_10) {
          return $return();
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  listen(old) {
    return new Promise(function ($return, $error) {
      var devicesS, devices;
      return this._send({
        type: `listen`,
        body: old == null ? null : old.map(device => {
          return _extends({}, device, {
            // hack for old extension
            product: 1,
            vendor: 21324,
            serialNumber: 0
          });
        })
      }).then(function ($await_11) {
        devicesS = $await_11;
        devices = check.devices(devicesS);

        return $return(devices);
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  enumerate() {
    return new Promise(function ($return, $error) {
      var devicesS, devices;
      return this._send({ type: `enumerate` }).then(function ($await_12) {
        devicesS = $await_12;
        devices = check.devices(devicesS);

        return $return(devices);
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  _acquireMixed(input) {
    return new Promise(function ($return, $error) {
      const checkPrevious = input.checkPrevious;
      if (checkPrevious) {
        return $return(this._send({
          type: `acquire`,
          body: {
            path: input.path,
            previous: input.previous
          }
        }));
      } else {
        return $return(this._send({
          type: `acquire`,
          body: input.path
        }));
      }
      return $return();
    }.$asyncbind(this));
  }

  acquire(input) {
    return new Promise(function ($return, $error) {
      var acquireS;
      return this._acquireMixed(input).then(function ($await_13) {
        acquireS = $await_13;

        return $return(check.acquire(acquireS));
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  release(session) {
    return new Promise(function ($return, $error) {
      return this._send({
        type: `release`,
        body: session
      }).then(function ($await_14) {
        return $return();
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  call(session, name, data) {
    return new Promise(function ($return, $error) {
      var res;
      return this._send({
        type: `call`,
        body: {
          id: session,
          type: name,
          message: data
        }
      }).then(function ($await_15) {
        res = $await_15;

        return $return(check.call(res));
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }
}, (_applyDecoratedDescriptor(_class.prototype, 'init', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'init'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'configure', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'configure'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'listen', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'listen'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'enumerate', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'enumerate'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'acquire', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'acquire'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'release', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'release'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'call', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'call'), _class.prototype)), _class);
exports.default = ChromeExtensionTransport;
module.exports = exports['default'];