"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.receiveAndParse = receiveAndParse;

var _message_decoder = require("./protobuf/message_decoder.js");

var _protobufjs = require("protobufjs");

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

// Logic of recieving data from trezor
// Logic of "call" is broken to two parts - sending and recieving

const MESSAGE_HEADER_BYTE = 0x23;

// input that might or might not be fully parsed yet
let PartiallyParsedInput = class PartiallyParsedInput {
  // Expected length of the raq message, in bytes
  constructor(typeNumber, length) {
    this.typeNumber = typeNumber;
    this.expectedLength = length;
    this.buffer = new _protobufjs.ByteBuffer(length);
  }
  // Buffer with the beginning of message; can be non-complete and WILL be modified
  // during the object's lifetime

  // Message type number

  isDone() {
    return this.buffer.offset >= this.expectedLength;
  }
  append(buffer) {
    this.buffer.append(buffer);
  }
  arrayBuffer() {
    const byteBuffer = this.buffer;
    byteBuffer.reset();
    return byteBuffer.toArrayBuffer();
  }
};

// Parses first raw input that comes from Trezor and returns some information about the whole message.

function parseFirstInput(bytes) {
  // convert to ByteBuffer so it's easier to read
  const byteBuffer = _protobufjs.ByteBuffer.concat([bytes]);

  // checking first two bytes
  const sharp1 = byteBuffer.readByte();
  const sharp2 = byteBuffer.readByte();
  if (sharp1 !== MESSAGE_HEADER_BYTE || sharp2 !== MESSAGE_HEADER_BYTE) {
    throw new Error(`Didn't receive expected header signature.`);
  }

  // reading things from header
  const type = byteBuffer.readUint16();
  const length = byteBuffer.readUint32();

  // creating a new buffer with the right size
  const res = new PartiallyParsedInput(type, length);
  res.append(byteBuffer);
  return res;
}

// If the whole message wasn't loaded in the first input, loads more inputs until everything is loaded.
// note: the return value is not at all important since it's still the same parsedinput
function receiveRest(parsedInput, receiver) {
  return new Promise(function ($return, $error) {
    var data;

    if (parsedInput.isDone()) {
      return $return();
    }
    return receiver().then(function ($await_1) {
      data = $await_1;


      // sanity check
      if (data == null) {
        return $error(new Error(`Received no data.`));
      }

      parsedInput.append(data);
      return $return(receiveRest(parsedInput, receiver));
    }.$asyncbind(this, $error), $error);
  }.$asyncbind(this));
}

// Receives the whole message as a raw data buffer (but without headers or type info)
function receiveBuffer(receiver) {
  return new Promise(function ($return, $error) {
    var data, partialInput;
    return receiver().then(function ($await_2) {
      data = $await_2;
      partialInput = parseFirstInput(data);
      return receiveRest(partialInput, receiver).then(function ($await_3) {
        return $return(partialInput);
      }.$asyncbind(this, $error), $error);
    }.$asyncbind(this, $error), $error);
  }.$asyncbind(this));
}

// Reads data from device and returns decoded message, that can be sent back to trezor.js
function receiveAndParse(messages, receiver) {
  return new Promise(function ($return, $error) {
    var received, typeId, buffer, decoder;
    return receiveBuffer(receiver).then(function ($await_4) {
      received = $await_4;
      typeId = received.typeNumber;
      buffer = received.arrayBuffer();
      decoder = new _message_decoder.MessageDecoder(messages, typeId, buffer);

      return $return({
        message: decoder.decodedJSON(),
        type: decoder.messageName()
      });
    }.$asyncbind(this, $error), $error);
  }.$asyncbind(this));
}