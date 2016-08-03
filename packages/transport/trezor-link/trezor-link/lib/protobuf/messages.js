"use strict";

// This is a simple class that represents information about messages,
// as they are loaded from the protobuf definition,
// so they are understood by both sending and recieving code.

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Messages = undefined;

var _protobufjs = require("protobufjs");

var ProtoBuf = _interopRequireWildcard(_protobufjs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class Messages {

  constructor(messages) {
    this.messagesByName = messages;

    const messagesByType = {};
    Object.keys(messages.MessageType).forEach(longName => {
      const typeId = messages.MessageType[longName];
      const shortName = longName.split(`_`)[1];
      messagesByType[typeId] = {
        name: shortName,
        constructor: messages[shortName]
      };
    });
    this.messagesByType = messagesByType;
    this.messageTypes = messages.MessageType;
  }
}
exports.Messages = Messages;