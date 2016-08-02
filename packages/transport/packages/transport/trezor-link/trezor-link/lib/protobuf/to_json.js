"use strict";

// Helper module that does conversion from already parsed protobuf's
// FileDescriptorSet to JSON, that can be used to initialize ProtoBuf.js
//
// Theoretically this should not be necessary, since FileDescriptorSet is protobuf "native" description,
// but ProtoBuf.js does NOT know how to make Builder from FileDescriptorSet, but it can build it from JSON.
// See https://github.com/dcodeIO/ProtoBuf.js/issues/250
//
// This conversion is probably not very stable and does not "scale" that well, since it's
// intended just for our relatively small usecase.
// But it works here.

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.protocolToJSON = protocolToJSON;

var _object = require("object.values");

if (!Object.values) {
  (0, _object.shim)();
}function protocolToJSON(p) {
  // TODO: what if there are more files?
  var res = fileToJSON(p.file[2]);
  res.imports = [fileToJSON(p.file[1])];
  return res;
}

function fileToJSON(f) {
  var res = {};
  res.package = f.package;
  res.options = f.options;
  res.services = [];
  var messagesSimple = Object.values(f.message_type).map(messageToJSON);
  var messagesRef = extensionToJSON(f.extension);
  res.messages = messagesRef.concat(messagesSimple);
  res.enums = Object.values(f.enum_type).map(enumToJSON);
  return res;
}

function enumToJSON(enumm) {
  var res = {};
  res.name = enumm.name;
  res.values = Object.values(enumm.value).map(enum_valueToJSON);
  res.options = {};
  return res;
}

function extensionToJSON(extensions) {
  var res = {};
  Object.values(extensions).forEach(function (extension) {
    var extendee = extension.extendee.slice(1);
    if (res[extendee] == null) {
      res[extendee] = {};
      res[extendee].ref = extendee;
      res[extendee].fields = [];
    }
    res[extendee].fields.push(fieldToJSON(extension));
  });
  return Object.values(res);
}

function enum_valueToJSON(val) {
  var res = {};
  res.name = val.name;
  res.id = val.number;
  return res;
}

function messageToJSON(message) {
  var res = {};
  res.enums = [];
  res.name = message.name;
  res.options = message.options || {};
  res.messages = [];
  res.fields = Object.values(message.field).map(fieldToJSON);
  res.oneofs = {};
  return res;
}

var type_map = {
  "1": "double",
  "2": "float",
  "3": "int64",
  "4": "uint64",
  "5": "int32",
  "6": "fixed64",
  "7": "fixed32",
  "8": "bool",
  "9": "string",
  "10": "group",
  "11": "message",
  "12": "bytes",
  "13": "uint32",
  "14": "enum",
  "15": "sfixed32",
  "16": "sfixed64",
  "17": "sint32",
  "18": "sint64"
};

function fieldToJSON(field) {
  var res = {};
  if (field.label === 1) {
    res.rule = "optional";
  }
  if (field.label === 2) {
    res.rule = "required";
  }
  if (field.label === 3) {
    res.rule = "repeated";
  }
  res.type = type_map[field.type];
  if (field.type_name) {
    res.type = field.type_name.slice(1);
  }
  res.name = field.name;
  res.options = field.options || {};
  res.id = field.number;
  return res;
}