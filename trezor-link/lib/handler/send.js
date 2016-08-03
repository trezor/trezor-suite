"use strict";

// Logic of sending data to trezor
//
// Logic of "call" is broken to two parts - sending and recieving

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildAndSend = buildAndSend;

var _protobufjs = require("protobufjs");

var ProtoBuf = _interopRequireWildcard(_protobufjs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const HEADER_SIZE = 1 + 1 + 4 + 2;
const MESSAGE_HEADER_BYTE = 0x23;
const BUFFER_SIZE = 63;

// Sends more buffers to device.
function sendBuffers(sender, buffers) {
  return buffers.reduce((prevPromise, buffer) => {
    return prevPromise.then(() => {
      return sender(buffer);
    });
  }, Promise.resolve());
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
  const buffers = buildBuffers(messages, name, data);
  return sendBuffers(sender, buffers);
}