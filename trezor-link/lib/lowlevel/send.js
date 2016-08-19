"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildAndSend = buildAndSend;

var _protobufjs = require("protobufjs");

var ProtoBuf = _interopRequireWildcard(_protobufjs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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
        return obj && obj instanceof Object && typeof obj.then === "function";
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
          return "EagerThenable{" + {
            "-1": "pending",
            0: "resolved",
            1: "rejected"
          }[phase] + "}=" + result.toString();
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
      return result && result instanceof Object && typeof result.then === "function" ? result.then(then, catcher) : resolver.call(self, result, error || catcher);
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

// Logic of sending data to trezor
//
// Logic of "call" is broken to two parts - sending and recieving

const HEADER_SIZE = 1 + 1 + 4 + 2;
const MESSAGE_HEADER_BYTE = 0x23;
const BUFFER_SIZE = 63;

// Sends more buffers to device.
function sendBuffers(sender, buffers) {
  return new Promise(function ($return, $error) {
    let buffer, $iterator_buffer;$iterator_buffer = [buffers[Symbol.iterator]()];
    return function $ForStatement_1_loop($ForStatement_1_exit, $error) {
      function $ForStatement_1_next() {
        return $ForStatement_1_loop($ForStatement_1_exit, $error);
      }

      if (!($iterator_buffer[1] = $iterator_buffer[0].next()).done && ((buffer = $iterator_buffer[1].value) || true)) {
        return sender(buffer).then(function ($await_3) {
          return void $ForStatement_1_next.call(this);
        }.$asyncbind(this, $error), $error);
      } else return void $ForStatement_1_exit();
    }.$asyncbind(this).then(function ($await_4) {
      return $return();
    }.$asyncbind(this, $error), $error);
  }.$asyncbind(this));
}

// already built PB message
class BuiltMessage {

  constructor(messages, // Builders, generated by reading config
  name, // Name of the message
  data // data as "pure" object, from trezor.js
  ) {
    const Builder = messages.messagesByName[name];
    if (Builder == null) {
      throw new Error(`The message name ${ name } is not found.`);
    }

    // cleans up stuff from angular and remove "null" that crashes in builder
    cleanupInput(data);

    if (data) {
      this.message = new Builder(data);
    } else {
      this.message = new Builder();
    }

    this.type = messages.messageTypes[`MessageType_${ name }`];
  }

  // encodes into "raw" data, but it can be too long and needs to be split into
  // smaller buffers
  _encodeLong() {
    const headerSize = HEADER_SIZE; // should be 8
    const bytes = new Uint8Array(this.message.encodeAB());
    const fullSize = headerSize + bytes.length;

    const encodedByteBuffer = new _protobufjs.ByteBuffer(fullSize);

    // first encode header

    // 2*1 byte
    encodedByteBuffer.writeByte(MESSAGE_HEADER_BYTE);
    encodedByteBuffer.writeByte(MESSAGE_HEADER_BYTE);

    // 2 bytes
    encodedByteBuffer.writeUint16(this.type);

    // 4 bytes (so 8 in total)
    encodedByteBuffer.writeUint32(bytes.length);

    // then put in the actual message
    encodedByteBuffer.append(bytes);

    // and convert to uint8 array
    // (it can still be too long to send though)
    const encoded = new Uint8Array(encodedByteBuffer.buffer);

    return encoded;
  }

  // encodes itself and splits into "nice" chunks
  encode() {
    const bytes = this._encodeLong();

    const result = [];
    const size = BUFFER_SIZE;

    // How many pieces will there actually be
    const count = Math.floor((bytes.length - 1) / size) + 1;

    // slice and dice
    for (let i = 0; i < count; i++) {
      const slice = bytes.subarray(i * size, (i + 1) * size);
      const newArray = new Uint8Array(size);
      newArray.set(slice);
      result.push(newArray.buffer);
    }

    return result;
  }
}

// Removes $$hashkey from angular and remove nulls
function cleanupInput(message) {
  delete message.$$hashKey;

  for (const key in message) {
    const value = message[key];
    if (value == null) {
      delete message[key];
    } else {
      if (Array.isArray(value)) {
        value.forEach(i => {
          if (typeof i === `object`) {
            cleanupInput(i);
          }
        });
      }
      if (typeof value === `object`) {
        cleanupInput(value);
      }
    }
  }
}

// Builds buffers to send.
// messages: Builders, generated by reading config
// name: Name of the message
// data: Data to serialize, exactly as given by trezor.js
// Returning buffers that will be sent to Trezor
function buildBuffers(messages, name, data) {
  const message = new BuiltMessage(messages, name, data);
  const encoded = message.encode();
  return encoded;
}

// Sends message to device.
// Resolves iff everything gets sent
function buildAndSend(messages, sender, name, data) {
  return new Promise(function ($return, $error) {
    const buffers = buildBuffers(messages, name, data);
    return $return(sendBuffers(sender, buffers));
  }.$asyncbind(this));
}