"use strict";

// Module for loading the protobuf description from serialized description

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseConfigure = parseConfigure;

var _protobufjs = require("protobufjs");

var ProtoBuf = _interopRequireWildcard(_protobufjs);

var _messages = require("./messages.js");

var _to_json = require("./to_json.js");

var _config_proto_compiled = require("./config_proto_compiled.js");

var compiledConfigProto = _interopRequireWildcard(_config_proto_compiled);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Parse configure data (it has to be already verified)
function parseConfigure(data) {
  var configBuilder = compiledConfigProto["Configuration"];
  var loadedConfig = configBuilder.decode(data);

  var validUntil = loadedConfig.valid_until;
  var timeNow = Math.floor(Date.now() / 1000);
  if (timeNow >= validUntil) {
    throw new Error("Config too old; " + timeNow + " >= " + validUntil);
  }

  var wireProtocol = loadedConfig.wire_protocol;
  var protocolJSON = (0, _to_json.protocolToJSON)(wireProtocol.toRaw());
  var protobufMessages = ProtoBuf.newBuilder({})["import"](protocolJSON).build();

  return new _messages.Messages(protobufMessages);
}