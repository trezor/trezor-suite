'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class;

var _debugDecorator = require('./debug-decorator');

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

var FallbackTransport = (_class = function () {
  function FallbackTransport(transports) {
    _classCallCheck(this, FallbackTransport);

    this.name = 'FallbackTransport';
    this.activeName = '';
    this.debug = false;

    this.transports = transports;
  }

  // first one that inits successfuly is the final one; others won't even start initing


  // note: activeTransport is actually "?Transport", but
  // everywhere I am using it is in `async`, so error gets returned as Promise.reject


  _createClass(FallbackTransport, [{
    key: '_tryInitTransports',
    value: function _tryInitTransports() {
      return new Promise(function ($return, $error) {
        var res, transport, $iterator_transport;
        var lastError = void 0;
        res = [];
        lastError = null;
        $iterator_transport = [this.transports[Symbol.iterator]()];
        return function $ForStatement_3_loop($ForStatement_3_exit, $error) {
          var _this = this;

          function $ForStatement_3_next() {
            return $ForStatement_3_loop.$asyncbind(this)($ForStatement_3_exit, $error);
          }

          if (!($iterator_transport[1] = $iterator_transport[0].next()).done && ((transport = $iterator_transport[1].value) || true)) {
            var $Try_1_Catch;

            var _ret = function () {
              var $Try_1_Post = function $Try_1_Post() {
                return void $ForStatement_3_next.call(this);
              };

              $Try_1_Catch = function (e) {
                lastError = e;
                $Try_1_Post.call(this)
              }.$asyncbind(_this, $error);

              try {
                return {
                  v: transport.init(_this.debug).then(function ($await_7) {
                    res.push(transport);
                    $Try_1_Post.call(this)
                  }.$asyncbind(_this, $Try_1_Catch), $Try_1_Catch)
                };
              } catch (e) {
                $Try_1_Catch(e)
              }
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
          } else return void $ForStatement_3_exit();
        }.$asyncbind(this).then(function ($await_8) {
          if (res.length === 0) {
            return $error(lastError || new Error('No transport could be initialized.'));
          }
          return $return(res);
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }

    // first one that inits successfuly is the final one; others won't even start initing

  }, {
    key: '_tryConfigureTransports',
    value: function _tryConfigureTransports(data) {
      return new Promise(function ($return, $error) {
        var lastError = void 0,
            transport = void 0,
            $iterator_transport = void 0;
        lastError = null;
        $iterator_transport = [this._availableTransports[Symbol.iterator]()];
        return function $ForStatement_4_loop($ForStatement_4_exit, $error) {
          var _this2 = this;

          function $ForStatement_4_next() {
            return $ForStatement_4_loop($ForStatement_4_exit, $error);
          }

          if (!($iterator_transport[1] = $iterator_transport[0].next()).done && ((transport = $iterator_transport[1].value) || true)) {
            var $Try_2_Catch;

            var _ret2 = function () {
              var $Try_2_Post = function $Try_2_Post() {
                return void $ForStatement_4_next.call(this);
              };

              $Try_2_Catch = function (e) {
                lastError = e;
                $Try_2_Post.call(this)
              }.$asyncbind(_this2, $error);

              try {
                return {
                  v: transport.configure(data).then(function ($await_9) {
                    return $return(transport);
                  }.$asyncbind(_this2, $Try_2_Catch), $Try_2_Catch)
                };
              } catch (e) {
                $Try_2_Catch(e)
              }
            }();

            if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
          } else return void $ForStatement_4_exit();
        }.$asyncbind(this).then(function ($await_10) {
          return $error(lastError || new Error('No transport could be initialized.'));
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }, {
    key: 'init',
    value: function init(debug) {
      return new Promise(function ($return, $error) {
        var transports;

        this.debug = !!debug;

        // init ALL OF THEM
        return this._tryInitTransports().then(function ($await_11) {
          transports = $await_11;

          this._availableTransports = transports;

          // a slight hack - configured is always false, so we force caller to call configure()
          // to find out the actual working transport (bridge falls on configure, not on info)
          this.version = transports[0].version;
          this.configured = false;
          return $return();
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }
  }, {
    key: 'configure',
    value: function configure(signedData) {
      return new Promise(function ($return, $error) {
        return this._tryConfigureTransports(signedData).then(function ($await_12) {
          this.activeTransport = $await_12;
          this.configured = this.activeTransport.configured;
          this.version = this.activeTransport.version;
          this.activeName = this.activeTransport.name;
          return $return();
        }.$asyncbind(this, $error), $error);
      }.$asyncbind(this));
    }

    // using async so I get Promise.recect on this.activeTransport == null (or other error), not Error

  }, {
    key: 'enumerate',
    value: function enumerate() {
      return new Promise(function ($return, $error) {
        return $return(this.activeTransport.enumerate());
      }.$asyncbind(this));
    }
  }, {
    key: 'listen',
    value: function listen(old) {
      return new Promise(function ($return, $error) {
        return $return(this.activeTransport.listen(old));
      }.$asyncbind(this));
    }
  }, {
    key: 'acquire',
    value: function acquire(input) {
      return new Promise(function ($return, $error) {
        return $return(this.activeTransport.acquire(input));
      }.$asyncbind(this));
    }
  }, {
    key: 'release',
    value: function release(session) {
      return new Promise(function ($return, $error) {
        return $return(this.activeTransport.release(session));
      }.$asyncbind(this));
    }
  }, {
    key: 'call',
    value: function call(session, name, data) {
      return new Promise(function ($return, $error) {
        return $return(this.activeTransport.call(session, name, data));
      }.$asyncbind(this));
    }
  }]);

  return FallbackTransport;
}(), (_applyDecoratedDescriptor(_class.prototype, 'init', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'init'), _class.prototype)), _class);
exports.default = FallbackTransport;
module.exports = exports['default'];