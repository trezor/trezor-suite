

"use strict";

// Logic of recieving data from trezor
// Logic of "call" is broken to two parts - sending and recieving

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.receiveAndParse = receiveAndParse;

var _message_decoder = require("../protobuf/message_decoder.js");

var _protobufjs = require("protobufjs");

const MESSAGE_HEADER_BYTE = 0x23;

// input that might or might not be fully parsed yet
class PartiallyParsedInput {
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
}

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
  if (parsedInput.isDone()) {
    return Promise.resolve();
  }

  return receiver().then(data => {
    // sanity check
    if (data == null) {
      throw new Error(`Received no data.`);
    }

    parsedInput.append(data);
    return receiveRest(parsedInput, receiver);
  });
}

// Receives the whole message as a raw data buffer (but without headers or type info)
function receiveBuffer(receiver) {
  return receiver().then(data => {
    const partialInput = parseFirstInput(data);

    return receiveRest(partialInput, receiver).then(() => {
      return partialInput;
    });
  });
}

// Reads data from device and returns decoded message, that can be sent back to trezor.js
function receiveAndParse(messages, receiver) {
  return receiveBuffer(receiver).then(received => {
    const typeId = received.typeNumber;
    const buffer = received.arrayBuffer();
    const decoder = new _message_decoder.MessageDecoder(messages, typeId, buffer);
    return {
      message: decoder.decodedJSON(),
      type: decoder.messageName()
    };
  });
}