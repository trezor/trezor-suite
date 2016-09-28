'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class;

exports.storageGet = storageGet;
exports.storageSet = storageSet;

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

var TREZOR_DESC = {
  vendorId: 0x534c,
  productId: 0x0001
};

var FORBIDDEN_DESCRIPTORS = [0xf1d0, 0xff01];
var REPORT_ID = 63;

function deviceToJson(device) {
  return {
    path: device.deviceId.toString()
  };
}

function hidEnumerate() {
  return new Promise(function (resolve, reject) {
    try {
      chrome.hid.getDevices(TREZOR_DESC, function (devices) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError));
        } else {
          resolve(devices);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function hidSend(id, reportId, data) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.hid.send(id, reportId, data, function () {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError));
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function hidReceive(id) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.hid.receive(id, function (reportId, data) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve({ data: data, reportId: reportId });
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function hidConnect(id) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.hid.connect(id, function (connection) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(connection.connectionId);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

// Disconnects from trezor.
// First parameter is connection ID (*not* device ID!)
function hidDisconnect(id) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.hid.disconnect(id, function () {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

// encapsulating chrome's platform info into Promise API
function platformInfo() {
  return new Promise(function (resolve, reject) {
    try {
      chrome.runtime.getPlatformInfo(function (info) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          if (info == null) {
            reject(new Error('info is null'));
          } else {
            resolve(info);
          }
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

function storageGet(key) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.storage.local.get(key, function (items) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          if (items[key] === null || items[key] === undefined) {
            resolve(null);
          } else {
            resolve(items[key]);
          }
          resolve(items);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

// Set to storage
function storageSet(key, value) {
  return new Promise(function (resolve, reject) {
    try {
      var obj = {};
      obj[key] = value;
      chrome.storage.local.set(obj, function () {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(undefined);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

var ChromeHidPlugin = (_class = function () {
  function ChromeHidPlugin() {
    _classCallCheck(this, ChromeHidPlugin);

    this.name = 'ChromeHidPlugin';
    this._hasReportId = {};
    this._udevError = false;
    this.version = "0.2.31";
    this.debug = false;
  }

  _createClass(ChromeHidPlugin, [{
    key: 'init',
    value: function init(debug) {
      this.debug = !!debug;
      try {
        if (chrome.hid.getDevices == null) {
          return Promise.reject(new Error('chrome.hid.getDevices is null'));
        } else {
          return Promise.resolve();
        }
      } catch (e) {
        return Promise.reject(e);
      }
    }
  }, {
    key: '_catchUdevError',
    value: function _catchUdevError(error) {
      var errMessage = error;
      if (errMessage.message !== undefined) {
        errMessage = error.message;
      }
      // A little heuristics.
      // If error message is one of these and the type of original message is initialization, it's
      // probably udev error.
      if (errMessage === 'Failed to open HID device.' || errMessage === 'Transfer failed.') {
        this._udevError = true;
      }
      throw error;
    }
  }, {
    key: '_isLinux',
    value: function _isLinux() {
      var _this = this;

      if (this._isLinuxCached != null) {
        return Promise.resolve(this._isLinuxCached);
      }
      return platformInfo().then(function (info) {
        var linux = info.os === 'linux';
        _this._isLinuxCached = linux;
        return linux;
      });
    }
  }, {
    key: '_isAfterInstall',
    value: function _isAfterInstall() {
      return storageGet('afterInstall').then(function (afterInstall) {
        return afterInstall !== false;
      });
    }
  }, {
    key: 'showUdevError',
    value: function showUdevError() {
      var _this2 = this;

      return this._isLinux().then(function (isLinux) {
        if (!isLinux) {
          return false;
        }
        return _this2._isAfterInstall().then(function (isAfterInstall) {
          if (isAfterInstall) {
            return true;
          } else {
            return _this2._udevError;
          }
        });
      });
    }
  }, {
    key: 'clearUdevError',
    value: function clearUdevError() {
      this._udevError = false;
      return storageSet('afterInstall', true);
    }
  }, {
    key: 'enumerate',
    value: function enumerate() {
      var _this3 = this;

      return hidEnumerate().then(function (devices) {
        return devices.filter(function (device) {
          return !FORBIDDEN_DESCRIPTORS.some(function (des) {
            return des === device.collections[0].usagePage;
          });
        });
      }).then(function (devices) {
        _this3._hasReportId = {};

        devices.forEach(function (device) {
          _this3._hasReportId[device.deviceId.toString()] = device.collections[0].reportIds.length !== 0;
        });

        return devices;
      }).then(function (devices) {
        return devices.map(function (device) {
          return deviceToJson(device);
        });
      });
    }
  }, {
    key: 'send',
    value: function send(device, session, data) {
      var _this4 = this;

      var sessionNu = parseInt(session);
      if (isNaN(sessionNu)) {
        return Promise.reject(new Error('Session ' + session + ' is not a number'));
      }
      var hasReportId = this._hasReportId[device.toString()];
      var reportId = hasReportId ? REPORT_ID : 0;

      var ab = data;
      if (!hasReportId) {
        var newArray = new Uint8Array(64);
        newArray[0] = 63;
        newArray.set(new Uint8Array(data), 1);
        ab = newArray.buffer;
      }

      return hidSend(sessionNu, reportId, ab).catch(function (e) {
        return _this4._catchUdevError(e);
      });
    }
  }, {
    key: 'receive',
    value: function receive(device, session) {
      var _this5 = this;

      var sessionNu = parseInt(session);
      if (isNaN(sessionNu)) {
        return Promise.reject(new Error('Session ' + session + ' is not a number'));
      }
      return hidReceive(sessionNu).then(function (_ref) {
        var data = _ref.data;
        var reportId = _ref.reportId;

        if (reportId !== 0) {
          return data;
        } else {
          return data.slice(1);
        }
      }).then(function (res) {
        return _this5.clearUdevError().then(function () {
          return res;
        });
      }).catch(function (e) {
        return _this5._catchUdevError(e);
      });
    }
  }, {
    key: 'connect',
    value: function connect(device) {
      var _this6 = this;

      var deviceNu = parseInt(device);
      if (isNaN(deviceNu)) {
        return Promise.reject(new Error('Device ' + deviceNu + ' is not a number'));
      }
      return hidConnect(deviceNu).then(function (d) {
        return d.toString();
      }).catch(function (e) {
        return _this6._catchUdevError(e);
      });
    }
  }, {
    key: 'disconnect',
    value: function disconnect(path, session) {
      var sessionNu = parseInt(session);
      if (isNaN(sessionNu)) {
        return Promise.reject(new Error('Session ' + session + ' is not a number'));
      }
      return hidDisconnect(sessionNu);
    }
  }]);

  return ChromeHidPlugin;
}(), (_applyDecoratedDescriptor(_class.prototype, 'init', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'init'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'connect', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'connect'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'disconnect', [_debugDecorator.debugInOut], Object.getOwnPropertyDescriptor(_class.prototype, 'disconnect'), _class.prototype)), _class);
exports.default = ChromeHidPlugin;