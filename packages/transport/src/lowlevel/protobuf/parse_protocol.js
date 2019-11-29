/* @flow */

"use strict";

// Module for loading the protobuf description from serialized description

import * as ProtoBuf from "protobufjs-old-fixed-webpack";

import {Messages} from "./messages.js";
import {protocolToJSON} from "./to_json.js";
import * as compiledConfigProto from "./config_proto_compiled.js";

// Parse configure data (it has to be already verified)
export function parseConfigure(data: JSON | string): Messages {
  // incoming data are in JSON format
  if (data && typeof data === `object` && Object.prototype.hasOwnProperty.call(data, `messages`)) {
    const protobufMessages = ProtoBuf.newBuilder({})[`import`](data).build();
    return new Messages(protobufMessages);
  }
  if (typeof data !== `string`) throw new Error(`Unexpected messages format`);
  // incoming data are in JSON.stringify format
  if (data.match(/^\{.*\}$/)) {
    const protobufMessages = ProtoBuf.newBuilder({})[`import`](JSON.parse(data)).build();
    return new Messages(protobufMessages);
  }

  // incoming data are in binary format
  const buffer = Buffer.from(data.slice(64 * 2), `hex`);
  const configBuilder = compiledConfigProto[`Configuration`];
  const loadedConfig = configBuilder.decode(buffer);

  const validUntil = loadedConfig.valid_until;
  const timeNow = Math.floor(Date.now() / 1000);
  if (timeNow >= validUntil) {
    throw new Error(`Config too old; ` + timeNow + ` >= ` + validUntil);
  }

  const wireProtocol = loadedConfig.wire_protocol;
  const protocolJSON = protocolToJSON(wireProtocol.toRaw());
  const protobufMessages = ProtoBuf.newBuilder({})[`import`](protocolJSON).build();

  return new Messages(protobufMessages);
}

