'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class;

var _debugDecorator = require('./debug-decorator');

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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

var ParallelTransport = (_class = function () {
  function ParallelTransport(transports) {
    _classCallCheck(this, ParallelTransport);

    this.name = 'ParallelTransport';
    this.debug = false;

    this.transports = transports;
  }

  _createClass(ParallelTransport, [{
    key: '_prepend',
    value: function _prepend(name, devices) {
      return devices.map(function (device) {
        return {
          path: name + '-' + device.path,
          session: device.session == null ? null : name + '-' + device.session
        };
      });
    }
  }, {
    key: '_filter',
    value: function _filter(name, devices) {
      var _this = this;

      return devices.filter(function (device) {
        return _this._parseName(device.path).name === name;
      }).map(function (device) {
        return _extends({}, device, {
          path: _this._parseName(device.path).rest,
          session: device.session == null ? device.session : _this._parseName(device.session).rest
        });
      });
    }
  }, {
    key: 'enumerate',
    value: function enumerate() {
      return new Promise(function ($return, $error) {
        var res, devices, name, $iterator_name;
        res = [];
        $iterator_name = [Object.keys(this.transports)[Symbol.iterator]()];
        return function $ForStatement_1_loop($ForStatement_1_exit, $error) {
          function $ForStatement_1_next() {
            return $ForStatement_1_loop.$asyncbind(this)($ForStatement_1_exit, $error);
          }

          if (!($iterator_name[1] = $iterator_name[0].next()).done && ((name = $iterator_name[1].value) || true)) {
            return this.transports[name].enumerate().then(function ($await_9) {
              var _res;

              devices = $await_9;

              (_res = res).push.apply(_res, _toConsumableArray(this._prepend(name, devices)));
              return void $ForStatement_1_next.call(this);
            }.$asyncbind(this, $error), $error);
          } else return void $ForStatement_1_exit();
        }.$asyncbind(this).then(function ($await_10) {
          return $return(res);
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }, {
    key: 'listen',
    value: function listen(old) {
      return new Promise(function ($return, $error) {
        var res, oldFiltered, devices, name, $iterator_name;
        res = [];
        $iterator_name = [Object.keys(this.transports)[Symbol.iterator]()];
        return function $ForStatement_2_loop($ForStatement_2_exit, $error) {
          function $ForStatement_2_next() {
            return $ForStatement_2_loop.$asyncbind(this)($ForStatement_2_exit, $error);
          }

          if (!($iterator_name[1] = $iterator_name[0].next()).done && ((name = $iterator_name[1].value) || true)) {
            oldFiltered = old == null ? null : this._filter(name, old);
            return this.transports[name].listen(oldFiltered).then(function ($await_11) {
              var _res2;

              devices = $await_11;

              (_res2 = res).push.apply(_res2, _toConsumableArray(this._prepend(name, devices)));
              return void $ForStatement_2_next.call(this);
            }.$asyncbind(this, $error), $error);
          } else return void $ForStatement_2_exit();
        }.$asyncbind(this).then(function ($await_12) {
          return $return(res);
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }, {
    key: '_parseName',
    value: function _parseName(input) {
      if (input == null) {
        throw new Error('Wrong input');
      }

      var _input$split = input.split('-');

      var _input$split2 = _toArray(_input$split);

      var name = _input$split2[0];

      var restArray = _input$split2.slice(1);

      if (restArray.length === 0) {
        throw new Error('Input has to contain transport name.');
      }
      var transport = this.transports[name];
      if (transport == null) {
        throw new Error('Input has to contain valid transport name.');
      }
      var rest = restArray.join('-');

      return {
        transport: transport,
        name: name,
        rest: rest
      };
    }
  }, {
    key: 'acquire',
    value: function acquire(input) {
      return new Promise(function ($return, $error) {
        var path, previous, newInput, res;
        path = this._parseName(input.path);
        previous = input.previous == null ? null : this._parseName(input.previous);

        if (previous != null && path.name !== previous.name) {
          return $error(new Error('Session transport has to equal path transport.'));
        }
        newInput = {
          path: path.rest,
          previous: previous == null ? null : previous.rest,
          checkPrevious: input.checkPrevious
        };
        return path.transport.acquire(newInput).then(function ($await_13) {
          res = $await_13;

          return $return(path.name + '-' + res);
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }, {
    key: 'release',
    value: function release(session) {
      return new Promise(function ($return, $error) {
        var sessionP = this._parseName(session);
        return $return(sessionP.transport.release(sessionP.rest));
      }.$asyncbind(this));
    }
  }, {
    key: '_checkConfigured',
    value: function _checkConfigured() {
      // configured is true if all of the transports are configured
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(this.transports)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var name = _step.value;

          var transport = this.transports[name];
          if (!transport.configured) {
            return false;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return true;
    }
  }, {
    key: 'configure',
    value: function configure(signedData) {
      return new Promise(function ($return, $error) {
        var transport, name, $iterator_name;
        $iterator_name = [Object.keys(this.transports)[Symbol.iterator]()];
        return function $ForStatement_3_loop($ForStatement_3_exit, $error) {
          function $ForStatement_3_next() {
            return $ForStatement_3_loop.$asyncbind(this)($ForStatement_3_exit, $error);
          }

          if (!($iterator_name[1] = $iterator_name[0].next()).done && ((name = $iterator_name[1].value) || true)) {
            transport = this.transports[name];
            return transport.configure(signedData).then(function ($await_14) {
              return void $ForStatement_3_next.call(this);
            }.$asyncbind(this, $error), $error);
          } else return void $ForStatement_3_exit();
        }.$asyncbind(this).then(function ($await_15) {
          this.configured = this._checkConfigured();
          return $return();
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }, {
    key: 'call',
    value: function call(session, name, data) {
      return new Promise(function ($return, $error) {
        var sessionP = this._parseName(session);
        return $return(sessionP.transport.call(sessionP.rest, name, data));
      }.$asyncbind(this));
    }

    // resolves when the transport can be used; rejects when it cannot

  }, {
    key: 'init',
    value: function init(debug) {
      return new Promise(function ($return, $error) {
        var transport, name, $iterator_name;
        var version = void 0;

        this.debug = !!debug;
        version = '';
        $iterator_name = [Object.keys(this.transports)[Symbol.iterator]()];
        return function $ForStatement_4_loop($ForStatement_4_exit, $error) {
          function $ForStatement_4_next() {
            return $ForStatement_4_loop.$asyncbind(this)($ForStatement_4_exit, $error);
          }

          if (!($iterator_name[1] = $iterator_name[0].next()).done && ((name = $iterator_name[1].value) || true)) {
            transport = this.transports[name];
            return transport.init(debug).then(function ($await_16) {
              version = version + (name + ':' + transport.version + ';');
              return void $ForStatement_4_next.call(this);
            }.$asyncbind(this, $error), $error);
          } else return void $ForStatement_4_exit();
        }.$asyncbind(this).then(function ($await_17) {
          this.version = version;
          this.configured = this._checkConfigured();
          return $return();
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }]);

  return ParallelTransport;
}(), (_applyDecoratedDescriptor(_class.prototype, 'enumerate', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'enumerate'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'listen', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'listen'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'acquire', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'acquire'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'release', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'release'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'configure', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'configure'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'call', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'call'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'init', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'init'), _class.prototype)), _class);
exports.default = ParallelTransport;
module.exports = exports['default'];