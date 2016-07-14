

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Handler = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _defered = require('./defered');

var _parse_protocol = require('./protobuf/parse_protocol');

var _verify = require('./verify');

// eslint-disable-next-line quotes
const stringify = require('json-stable-stringify');

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

  _releaseDisconnected(devices) {}

  listen(old) {
    const oldStringified = stringify(old);
    const last = old == null ? this._lastStringified : oldStringified;
    return this._runIter(0, last);
  }

  _runIter(iteration, oldStringified) {
    return this.enumerate().then(devices => {
      const stringified = stringify(devices);
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
      const releasePromise = this._realRelease(realPrevious);
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
        this.deferedOnRelease[parsed.path] = (0, _defered.create)();
        return { session: session };
      });
    });
  }

  release(path) {
    return this.lock(() => this._realRelease(path));
  }

  _realRelease(path) {
    return this.transport.disconnect(path).then(() => {
      this._releaseCleanup(path);
    });
  }

  _releaseCleanup(path) {
    const session = this.connections[path];
    delete this.reverse[session];
    delete this.connections[path];
    this.deferedOnRelease[path].reject(new Error(`Device released or disconnected`));
    return;
  }

  configure(signedData) {
    return (0, _verify.verifyHexBin)(signedData).then(data => {
      return (0, _parse_protocol.parseConfigure)(data);
    }).then(messages => {
      this._messages = messages;
      return;
    });
  }
}
exports.Handler = Handler;