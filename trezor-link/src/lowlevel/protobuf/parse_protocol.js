/* @flow */

"use strict";

// Module for loading the protobuf description from serialized description

import * as ProtoBuf from "protobufjs-old-fixed-webpack";

import {Messages} from "./messages.js";
import {protocolToJSON} from "./to_json.js";
import * as compiledConfigProto from "./config_proto_compiled.js";

// Parse configure data (it has to be already verified)
export function parseConfigure(data: Buffer): Messages {
  const configBuilder = compiledConfigProto[`Configuration`];
  const loadedConfig = configBuilder.decode(data);

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

