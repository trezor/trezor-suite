'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class;

var _defered = require('../defered');

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

var ChromeUdpPlugin = (_class = function () {
  function ChromeUdpPlugin(portDiff) {
    _classCallCheck(this, ChromeUdpPlugin);

    this.name = 'ChromeUdpPlugin';
    this.waiting = {};
    this.buffered = {};
    this.infos = {};
    this.version = "0.2.31";
    this.debug = false;
    this.ports = [];

    if (portDiff == null) {
      this.portDiff = 3;
    } else {
      this.portDiff = portDiff;
    }
  }

  _createClass(ChromeUdpPlugin, [{
    key: 'init',
    value: function init(debug) {
      var _this = this;

      this.debug = !!debug;
      try {
        chrome.sockets.udp.onReceive.addListener(function (_ref) {
          var socketId = _ref.socketId;
          var data = _ref.data;

          _this._udpListener(socketId, data);
        });
        return Promise.resolve();
      } catch (e) {
        // if not Chrome, not sockets etc, this will reject
        return Promise.reject(e);
      }
    }
  }, {
    key: 'setPorts',
    value: function setPorts(ports) {
      if (ports.length > this.portDiff) {
        throw new Error('Too many ports. Max ' + this.portDiff + ' allowed.');
      }
      this.ports = ports;
    }
  }, {
    key: 'enumerate',
    value: function enumerate() {
      var devices = this.ports.map(function (port) {
        return {
          path: port.toString()
        };
      });
      return Promise.resolve(devices);
    }
  }, {
    key: 'send',
    value: function send(device, session, data) {
      var socket = parseInt(session);
      if (isNaN(socket)) {
        return Promise.reject(new Error('Session not a number'));
      }
      return this._udpSend(socket, data);
    }
  }, {
    key: 'receive',
    value: function receive(device, session) {
      var socket = parseInt(session);
      if (isNaN(socket)) {
        return Promise.reject(new Error('Session not a number'));
      }
      return this._udpReceive(socket);
    }
  }, {
    key: 'connect',
    value: function connect(device) {
      var port = parseInt(device);
      if (isNaN(port)) {
        return Promise.reject(new Error('Device not a number'));
      }
      return this._udpConnect(port).then(function (n) {
        return n.toString();
      });
    }
  }, {
    key: 'disconnect',
    value: function disconnect(path, session) {
      var socket = parseInt(session);
      if (isNaN(socket)) {
        return Promise.reject(new Error('Session not a number'));
      }
      return this._udpDisconnect(socket);
    }
  }, {
    key: '_udpDisconnect',
    value: function _udpDisconnect(socketId) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        try {
          chrome.sockets.udp.close(socketId, function () {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              delete _this2.infos[socketId.toString()];
              resolve();
            }
          });
        } catch (e) {
          reject(e);
        }
      });
    }
  }, {
    key: '_udpConnect',
    value: function _udpConnect(port) {
      var _this3 = this;

      var address = '127.0.0.1';
      return new Promise(function (resolve, reject) {
        try {
          chrome.sockets.udp.create({}, function (_ref2) {
            var socketId = _ref2.socketId;

            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              try {
                chrome.sockets.udp.bind(socketId, '127.0.0.1', port + _this3.portDiff, function (result) {
                  if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                  } else {
                    if (result >= 0) {
                      _this3.infos[socketId.toString()] = { address: address, port: port };
                      resolve(socketId);
                    } else {
                      reject('Cannot create socket, error: ' + result);
                    }
                  }
                });
              } catch (e) {
                reject(e);
              }
            }
          });
        } catch (e) {
          reject(e);
        }
      });
    }
  }, {
    key: '_udpReceive',
    value: function _udpReceive(socketId) {
      return this._udpReceiveUnsliced(socketId).then(function (data) {
        var dataView = new Uint8Array(data);
        if (dataView[0] !== 63) {
          throw new Error('Invalid data; first byte should be 63, is ' + dataView[0]);
        }
        return data.slice(1);
      });
    }
  }, {
    key: '_udpReceiveUnsliced',
    value: function _udpReceiveUnsliced(socketId) {
      var id = socketId.toString();

      if (this.buffered[id] != null) {
        var res = this.buffered[id].shift();
        if (this.buffered[id].length === 0) {
          delete this.buffered[id];
        }
        return Promise.resolve(res);
      }

      if (this.waiting[id] != null) {
        return Promise.reject('Something else already listening on socketId ' + socketId);
      }
      var d = (0, _defered.create)();
      this.waiting[id] = d;
      return d.promise;
    }
  }, {
    key: '_udpSend',
    value: function _udpSend(socketId, data) {
      var id = socketId.toString();
      var info = this.infos[id];
      if (info == null) {
        return Promise.reject('Socket ' + socketId + ' does not exist');
      }

      var sendDataV = new Uint8Array(64);
      sendDataV[0] = 63;
      sendDataV.set(new Uint8Array(data), 1);
      var sendData = sendDataV.buffer;

      return new Promise(function (resolve, reject) {
        try {
          chrome.sockets.udp.send(socketId, sendData, info.address, info.port, function (_ref3) {
            var resultCode = _ref3.resultCode;

            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              if (resultCode >= 0) {
                resolve();
              } else {
                reject('Cannot send, error: ' + resultCode);
              }
            }
          });
        } catch (e) {
          reject(e);
        }
      });
    }
  }, {
    key: '_udpListener',
    value: function _udpListener(socketId, data) {
      var id = socketId.toString();
      var d = this.waiting[id];
      if (d != null) {
        d.resolve(data);
        delete this.waiting[id];
      } else {
        if (this.infos[id] != null) {
          if (this.buffered[id] == null) {
            this.buffered[id] = [];
          }
          this.buffered[id].pop(data);
        }
      }
    }
  }]);

  return ChromeUdpPlugin;
}(), (_applyDecoratedDescriptor(_class.prototype, 'init', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'init'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'connect', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'connect'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'disconnect', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'disconnect'), _class.prototype)), _class);
exports.default = ChromeUdpPlugin;
module.exports = exports['default'];