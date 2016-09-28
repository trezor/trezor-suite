'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _desc, _value, _class;

var _semverCompare = require('semver-compare');

var _semverCompare2 = _interopRequireDefault(_semverCompare);

var _http = require('./http');

var _highlevelChecks = require('../highlevel-checks');

var check = _interopRequireWildcard(_highlevelChecks);

var _debugDecorator = require('../debug-decorator');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var DEFAULT_URL, DEFAULT_VERSION_URL;
DEFAULT_URL = `https://localback.net:21324`;
DEFAULT_VERSION_URL = `https://wallet.mytrezor.com/data/bridge/latest.txt`;
var BridgeTransport = (_class = class BridgeTransport {

  // nodeFetch for using bridge in node (so it is not needlessly imported in browserify)
  constructor(url, newestVersionUrl, nodeFetch) {
    this.name = `BridgeTransport`;
    this.version = ``;
    this.configured = false;
    this.debug = false;

    this.url = url == null ? DEFAULT_URL : url;
    this.newestVersionUrl = newestVersionUrl == null ? DEFAULT_VERSION_URL : newestVersionUrl;
    if (nodeFetch != null) {
      (0, _http.setFetch)(nodeFetch);
    }
  }

  _post(options) {
    return new Promise(function ($return, $error) {
      return (0, _http.request)(_extends({}, options, { method: `POST`, url: this.url + options.url })).then($return, $error);
    }.$asyncbind(this));
  }

  _get(options) {
    return new Promise(function ($return, $error) {
      return (0, _http.request)(_extends({}, options, { method: `GET`, url: this.url + options.url })).then($return, $error);
    }.$asyncbind(this));
  }

  init(debug) {
    return new Promise(function ($return, $error) {
      this.debug = !!debug;
      return this._silentInit().then(function ($await_3) {
        return $return();
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  _silentInit() {
    return new Promise(function ($return, $error) {
      var infoS, info, newVersion;
      return (0, _http.request)({
        url: this.url,
        method: `GET`
      }).then(function ($await_4) {
        infoS = $await_4;
        info = check.info(infoS);

        this.version = info.version;
        this.configured = info.configured;
        return (0, _http.request)({
          url: this.newestVersionUrl,
          method: `GET`
        }).then(function ($await_5) {
          newVersion = check.version($await_5);

          this.isOutdated = (0, _semverCompare2.default)(this.version, newVersion) < 0;
          return $return();
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  configure(config) {
    return new Promise(function ($return, $error) {
      return this._post({
        url: `/configure`,
        body: config
      }).then(function ($await_6) {
        return this._silentInit().then(function ($await_7) {
          return $return();
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  listen(old) {
    return new Promise(function ($return, $error) {
      var devicesS, devices;
      return (old == null ? this._get({ url: `/listen` }) : this._post({
        url: `/listen`,
        body: old.map(device => {
          return _extends({}, device, {
            // hack for old trezord
            product: 1,
            vendor: 21324
          });
        })
      })).then(function ($await_8) {
        devicesS = $await_8;
        devices = check.devices(devicesS);

        return $return(devices);
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  enumerate() {
    return new Promise(function ($return, $error) {
      var devicesS, devices;
      return this._get({ url: `/enumerate` }).then(function ($await_9) {
        devicesS = $await_9;
        devices = check.devices(devicesS);

        return $return(devices);
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  _acquireMixed(input) {
    return new Promise(function ($return, $error) {
      var checkPrevious = input.checkPrevious && (0, _semverCompare2.default)(this.version, `1.1.3`) >= 0;
      if (checkPrevious) {
        var previousStr = input.previous == null ? `null` : input.previous;
        var _url = `/acquire/` + input.path + `/` + previousStr;
        return $return(this._post({ url: _url }));
      } else {
        return $return(this._post({ url: `/acquire/` + input.path }));
      }
      return $return();
    }.$asyncbind(this));
  }

  acquire(input) {
    return new Promise(function ($return, $error) {
      var acquireS;
      return this._acquireMixed(input).then(function ($await_10) {
        acquireS = $await_10;

        return $return(check.acquire(acquireS));
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  release(session) {
    return new Promise(function ($return, $error) {
      return this._post({ url: `/release/` + session }).then(function ($await_11) {
        return $return();
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }

  call(session, name, data) {
    return new Promise(function ($return, $error) {
      var res;
      return this._post({
        url: `/call/` + session,
        body: {
          type: name,
          message: data
        }
      }).then(function ($await_12) {
        res = $await_12;

        return $return(check.call(res));
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this));
  }
}, (_applyDecoratedDescriptor(_class.prototype, 'init', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'init'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'configure', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'configure'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'listen', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'listen'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'enumerate', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'enumerate'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'acquire', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'acquire'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'release', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'release'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'call', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'call'), _class.prototype)), _class);
exports.default = BridgeTransport;
module.exports = exports['default'];