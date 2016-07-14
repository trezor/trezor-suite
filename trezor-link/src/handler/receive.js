/* @flow */

"use strict";

// Logic of recieving data from trezor
// Logic of "call" is broken to two parts - sending and recieving

import {MessageDecoder} from "../protobuf/message_decoder.js";
import {ByteBuffer} from "protobufjs";
import type {Messages} from "../protobuf/messages.js";
import type {MessageFromTrezor} from "./index";


const MESSAGE_HEADER_BYTE: number = 0x23;

// input that might or might not be fully parsed yet
class PartiallyParsedInput {
  // Message type number
  typeNumber: number;
  // Expected length of the raq message, in bytes
  expectedLength: number;
  // Buffer with the beginning of message; can be non-complete and WILL be modified
  // during the object's lifetime
  buffer: ByteBuffer;
  constructor(typeNumber: number, length: number) {
    this.typeNumber = typeNumber;
    this.expectedLength = length;
    this.buffer = new ByteBuffer(length);
  }
  isDone(): boolean {
    return (this.buffer.offset >= this.expectedLength);
  }
  append(buffer: ByteBuffer):void {
    this.buffer.append(buffer);
  }
  arrayBuffer(): ArrayBuffer {
    const byteBuffer: ByteBuffer = this.buffer;
    byteBuffer.reset();
    return byteBuffer.toArrayBuffer();
  }
}

// Parses first raw input that comes from Trezor and returns some information about the whole message.
function parseFirstInput(bytes: ArrayBuffer): PartiallyParsedInput {
  // convert to ByteBuffer so it's easier to read
  const byteBuffer: ByteBuffer = ByteBuffer.concat([bytes]);

  // checking first two bytes
  const sharp1: number = byteBuffer.readByte();
  const sharp2: number = byteBuffer.readByte();
  if (sharp1 !== MESSAGE_HEADER_BYTE || sharp2 !== MESSAGE_HEADER_BYTE) {
    throw new Error(`Didn't receive expected header signature.`);
  }

  // reading things from header
  const type: number = byteBuffer.readUint16();
  const length: number = byteBuffer.readUint32();

  // creating a new buffer with the right size
  const res: PartiallyParsedInput = new PartiallyParsedInput(type, length);
  res.append(byteBuffer);
  return res;
}

// If the whole message wasn't loaded in the first input, loads more inputs until everything is loaded.
// note: the return value is not at all important since it's still the same parsedinput
function receiveRest(
  parsedInput: PartiallyParsedInput,
  receiver: () => Promise<ArrayBuffer>
): Promise<void> {
  if (parsedInput.isDone()) {
    return Promise.resolve();
  }

  return receiver().then((data) => {
    // sanity check
    if (data == null) {
      throw new Error(`Received no data.`);
    }

    parsedInput.append(data);
    return receiveRest(parsedInput, receiver);
  });
}

// Receives the whole message as a raw data buffer (but without headers or type info)
function receiveBuffer(
  receiver: () => Promise<ArrayBuffer>
): Promise<PartiallyParsedInput> {
  return receiver().then((data: ArrayBuffer) => {
    const partialInput: PartiallyParsedInput = parseFirstInput(data);

    return receiveRest(partialInput, receiver).then(() => {
      return partialInput;
    });
  });
}

// Reads data from device and returns decoded message, that can be sent back to trezor.js
export function receiveAndParse(
  messages: Messages,
  receiver: () => Promise<ArrayBuffer>
): Promise<MessageFromTrezor> {
  return receiveBuffer(receiver).then((received) => {
    const typeId: number = received.typeNumber;
    const buffer: ArrayBuffer = received.arrayBuffer();
    const decoder: MessageDecoder = new MessageDecoder(messages, typeId, buffer);
    return {
      message: decoder.decodedJSON(),
      type: decoder.messageName(),
    };
  });
}
