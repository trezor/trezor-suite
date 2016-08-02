"use strict";

// Logic of recieving data from trezor
// Logic of "call" is broken to two parts - sending and recieving

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.receiveAndParse = receiveAndParse;

var _message_decoder = require("../protobuf/message_decoder.js");

var _protobufjs = require("protobufjs");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MESSAGE_HEADER_BYTE = 0x23;

// input that might or might not be fully parsed yet

var PartiallyParsedInput = function () {
  // Expected length of the raq message, in bytes
  function PartiallyParsedInput(typeNumber, length) {
    _classCallCheck(this, PartiallyParsedInput);

    this.typeNumber = typeNumber;
    this.expectedLength = length;
    this.buffer = new _protobufjs.ByteBuffer(length);
  }
  // Buffer with the beginning of message; can be non-complete and WILL be modified
  // during the object's lifetime

  // Message type number


  _createClass(PartiallyParsedInput, [{
    key: "isDone",
    value: function isDone() {
      return this.buffer.offset >= this.expectedLength;
    }
  }, {
    key: "append",
    value: function append(buffer) {
      this.buffer.append(buffer);
    }
  }, {
    key: "arrayBuffer",
    value: function arrayBuffer() {
      var byteBuffer = this.buffer;
      byteBuffer.reset();
      return byteBuffer.toArrayBuffer();
    }
  }]);

  return PartiallyParsedInput;
}();

// Parses first raw input that comes from Trezor and returns some information about the whole message.


function parseFirstInput(bytes) {
  // convert to ByteBuffer so it's easier to read
  var byteBuffer = _protobufjs.ByteBuffer.concat([bytes]);

  // checking first two bytes
  var sharp1 = byteBuffer.readByte();
  var sharp2 = byteBuffer.readByte();
  if (sharp1 !== MESSAGE_HEADER_BYTE || sharp2 !== MESSAGE_HEADER_BYTE) {
    throw new Error("Didn't receive expected header signature.");
  }

  // reading things from header
  var type = byteBuffer.readUint16();
  var length = byteBuffer.readUint32();

  // creating a new buffer with the right size
  var res = new PartiallyParsedInput(type, length);
  res.append(byteBuffer);
  return res;
}

// If the whole message wasn't loaded in the first input, loads more inputs until everything is loaded.
// note: the return value is not at all important since it's still the same parsedinput
function receiveRest(parsedInput, receiver) {
  if (parsedInput.isDone()) {
    return Promise.resolve();
  }

  return receiver().then(function (data) {
    // sanity check
    if (data == null) {
      throw new Error("Received no data.");
    }

    parsedInput.append(data);
    return receiveRest(parsedInput, receiver);
  });
}

// Receives the whole message as a raw data buffer (but without headers or type info)
function receiveBuffer(receiver) {
  return receiver().then(function (data) {
    var partialInput = parseFirstInput(data);

    return receiveRest(partialInput, receiver).then(function () {
      return partialInput;
    });
  });
}

// Reads data from device and returns decoded message, that can be sent back to trezor.js
function receiveAndParse(messages, receiver) {
  return receiveBuffer(receiver).then(function (received) {
    var typeId = received.typeNumber;
    var buffer = received.arrayBuffer();
    var decoder = new _message_decoder.MessageDecoder(messages, typeId, buffer);
    return {
      message: decoder.decodedJSON(),
      type: decoder.messageName()
    };
  });
}