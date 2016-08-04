"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Handler = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _defered = require('../defered');

var _parse_protocol = require('../protobuf/parse_protocol');

var _verify = require('./verify');

var _send = require('./send');

var _receive = require('./receive');

var _combinedTransport = require('../combined-transport');

// eslint-disable-next-line quotes
const stringify = require('json-stable-stringify');

function stableStringify(devices) {
  if (devices == null) {
    return `null`;
  }
  const pureDevices = devices.map(device => {
    const path = device.path;
    const session = device.session == null ? null : device.session;
    return { path: path, session: session };
  });
  return stringify(pureDevices);
}

function parseAcquireInput(input) {
  // eslint-disable-next-line quotes
  if (typeof input !== 'string') {
    const path = input.path.toString();
    const previous = input.previous == null ? null : input.previous.toString();
    return {
      path: path,
      previous: previous,
      checkPrevious: true
    };
  } else {
    const path = input.toString();
    return {
      path: path,
      previous: null,
      checkPrevious: false
    };
  }
}

function compare(a, b) {
  if (!isNaN(a.path)) {
    return parseInt(a.path) - parseInt(b.path);
  } else {
    return a.path < a.path ? -1 : a.path > a.path ? 1 : 0;
  }
}

function timeoutPromise(delay) {
  return new Promise(resolve => {
    window.setTimeout(() => resolve(), delay);
  });
}

const ITER_MAX = 60;
const ITER_DELAY = 500;

class Handler {

  // session => path


  // path => promise rejecting on release
  constructor(transport) {
    this._lock = Promise.resolve();
    this.deferedOnRelease = {};
    this.connections = {};
    this.reverse = {};
    this._lastStringified = ``;

    this.transport = transport;
  }

  // path => session


  lock(fn) {
    const res = this._lock.then(() => fn());
    this._lock = res.catch(() => {});
    return res;
  }

  enumerate() {
    return this.lock(() => {
      return this.transport.enumerate().then(devices => devices.map(device => {
        return _extends({}, device, {
          session: this.connections[device.path]
        });
      })).then(devices => {
        this._releaseDisconnected(devices);
        return devices;
      }).then(devices => {
        return devices.sort(compare);
      });
    });
  }

  _releaseDisconnected(devices) {
    const connected = {};
    devices.forEach(device => {
      connected[device.path] = true;
    });
    Object.keys(this.connections).forEach(path => {
      if (connected[path] == null) {
        if (this.connections[path] != null) {
          this._releaseCleanup(this.connections[path]);
        }
      }
    });
  }

  listen(old) {
    const oldStringified = stableStringify(old);
    const last = old == null ? this._lastStringified : oldStringified;
    return this._runIter(0, last);
  }

  _runIter(iteration, oldStringified) {
    return this.enumerate().then(devices => {
      const stringified = stableStringify(devices);
      if (stringified !== oldStringified || iteration === ITER_MAX) {
        this._lastStringified = stringified;
        return devices;
      }
      return timeoutPromise(ITER_DELAY).then(() => this._runIter(iteration + 1, stringified));
    });
  }

  _checkAndReleaseBeforeAcquire(parsed) {
    const realPrevious = this.connections[parsed.path];
    if (parsed.checkPrevious) {
      let error = false;
      if (realPrevious == null) {
        error = parsed.previous != null;
      } else {
        error = parsed.previous !== realPrevious;
      }
      if (error) {
        throw new Error(`wrong previous session`);
      }
    }
    if (realPrevious != null) {
      const releasePromise = this._realRelease(parsed.path, realPrevious);
      return releasePromise;
    } else {
      return Promise.resolve();
    }
  }

  acquire(input) {
    const parsed = parseAcquireInput(input);
    return this.lock(() => {
      return this._checkAndReleaseBeforeAcquire(parsed).then(() => this.transport.connect(parsed.path)).then(session => {
        this.connections[parsed.path] = session;
        this.reverse[session] = parsed.path;
        this.deferedOnRelease[session] = (0, _defered.create)();
        return session;
      });
    });
  }

  release(session) {
    const path = this.reverse[session];
    if (path == null) {
      return Promise.reject(new Error(`Trying to double release.`));
    }
    return this.lock(() => this._realRelease(path, session));
  }

  _realRelease(path, session) {
    return this.transport.disconnect(path, session).then(() => {
      this._releaseCleanup(session);
    });
  }

  _releaseCleanup(session) {
    const path = this.reverse[session];
    delete this.reverse[session];
    delete this.connections[path];
    this.deferedOnRelease[session].reject(new Error(`Device released or disconnected`));
    delete this.deferedOnRelease[session];
    return;
  }

  configure(signedData) {
    try {
      const buffer = (0, _verify.verifyHexBin)(signedData);
      const messages = (0, _parse_protocol.parseConfigure)(buffer);
      this._messages = messages;
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  _sendTransport(session) {
    const path = this.reverse[session];
    return data => this.transport.send(path, session, data);
  }

  _receiveTransport(session) {
    const path = this.reverse[session];
    return () => this.transport.receive(path, session);
  }

  call(session, name, data) {
    if (this._messages == null) {
      return Promise.reject(new Error(`Handler not configured.`));
    }
    if (this.reverse[session] == null) {
      return Promise.reject(new Error(`Trying to use device after release.`));
    }
    const messages = this._messages;
    const resPromise = (0, _send.buildAndSend)(messages, this._sendTransport(session), name, data).then(() => {
      return (0, _receive.receiveAndParse)(messages, this._receiveTransport(session));
    });
    return Promise.race([this.deferedOnRelease[session].rejectingPromise, resPromise]);
  }

  hasMessages() {
    if (this._messages == null) {
      return Promise.resolve(false);
    } else {
      return Promise.resolve(true);
    }
  }

  static combineTransports(transports) {
    return new _combinedTransport.CombinedTransport(transports);
  }
}
exports.Handler = Handler;