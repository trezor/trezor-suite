/* @flow */

"use strict";

// This is a simple class that represents information about messages,
// as they are loaded from the protobuf definition,
// so they are understood by both sending and recieving code.

import * as ProtoBuf from "protobufjs-old-fixed-webpack";

type MessageArray<KeyType> = { [key: KeyType]: ProtoBuf.Bulder.Message };

export class Messages {
  messagesByName: MessageArray<string>;
  messagesByType: MessageArray<number>;
  messageTypes: { [key: string]: number };

  constructor(messages: MessageArray<string>) {
    this.messagesByName = messages;

    const messagesByType: MessageArray<number> = {};
    Object.keys(messages.MessageType).forEach(longName => {
      const typeId = messages.MessageType[longName];

      let shortName = longName.split(`_`)[1];

      // hack hack hack. total lib refactor needed.
      const indexOfDeprecated = longName.indexOf(`Deprecated`);
      if (indexOfDeprecated >= 0) {
        shortName = longName.substr(indexOfDeprecated);
      }

      messagesByType[typeId] = {
        name: shortName,
        constructor: messages[shortName],
      };
    });
    this.messagesByType = messagesByType;
    this.messageTypes = messages.MessageType;
  }
}

