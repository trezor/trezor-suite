'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _desc, _value, _class;

var _nodeHid = require('node-hid');

var HID = _interopRequireWildcard(_nodeHid);

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

const REPORT_ID = 63;

const TREZOR_DESC = {
  vendorId: 0x534c,
  productId: 0x0001
};

let NodeHidPlugin = (_class = class NodeHidPlugin {
  constructor() {
    this.name = `NodeHidPlugin`;
    this._sessionCounter = 0;
    this._devices = {};
    this.version = "0.2.25";
    this.debug = false;
  }

  // path => device


  init(debug) {
    return new Promise(function ($return, $error) {
      // try if it's a Node environment
      if (typeof process === `object` && process != null && process.toString() === `[object process]`) {
        return $return();
      }
      HID.devices(); // try to read devices once, to maybe get an error now before it's too late
      return $error(new Error(`Not a node environment.`));
    }.$asyncbind(this));
  }

  enumerate() {
    return new Promise(function ($return, $error) {
      const devices = HID.devices().filter(d => d.vendorId === TREZOR_DESC.vendorId && d.productId === TREZOR_DESC.productId).map(device => {
        const path = device.path;
        return {
          path: path
        };
      });
      return $return(devices);
    }.$asyncbind(this));
  }

  send(path, session, data) {
    return new Promise(function ($return, $error) {
      const device = this._devices[path];
      const toWrite = [REPORT_ID].concat(Array.from(new Uint8Array(data)));
      device.write(toWrite);
      return $return();
    }.$asyncbind(this));
  }

  receive(path, session) {
    const device = this._devices[path];
    return new Promise((resolve, reject) => {
      device.read((error, data) => {
        if (error != null) {
          reject(error);
        } else {
          if (data == null) {
            reject(new Error(`Data is null`));
          } else {
            if (data[0] !== 63) {
              reject(new Error(`Invalid data; first byte should be 63, is ${ data[0] }`));
            }
            resolve(nodeBuffer2arrayBuffer(data.slice(1)));
          }
        }
      });
    });
  }

  connect(path) {
    return new Promise(function ($return, $error) {
      const counter = this._sessionCounter;
      this._sessionCounter++;
      const device = new HID.HID(path);
      this._devices[path] = device;
      // I am pausing, since I am not using the EventEmitter API, but the read() API
      device.pause();
      return $return(counter.toString());
    }.$asyncbind(this));
  }

  disconnect(path, session) {
    return new Promise(function ($return, $error) {
      const device = this._devices[path];
      device.close();
      delete this._devices[path];
      return $return();
    }.$asyncbind(this));
  }
}, (_applyDecoratedDescriptor(_class.prototype, 'init', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'init'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'connect', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'connect'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'disconnect', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'disconnect'), _class.prototype)), _class);
exports.default = NodeHidPlugin;


function nodeBuffer2arrayBuffer(b) {
  return new Uint8Array(b).buffer;
}
module.exports = exports['default'];