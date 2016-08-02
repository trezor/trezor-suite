"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.patch = patch;

var _protobufjs = require("protobufjs");

var ProtoBuf = _interopRequireWildcard(_protobufjs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var patched = false;

// monkey-patching ProtoBuf,
// so that bytes are loaded and decoded from hexadecimal
// when we expect bytes and we get string
function patch() {
  if (!patched) {
    ProtoBuf.Reflect.Message.Field.prototype.verifyValueOriginal = ProtoBuf.Reflect.Message.Field.prototype.verifyValue;

    // note: don't rewrite this function to arrow (value, skipRepeated) => ....
    // since I need `this` from the original context
    ProtoBuf.Reflect.Message.Field.prototype.verifyValue = function (value, skipRepeated) {
      var newValue = value;
      if (this.type === ProtoBuf.TYPES["bytes"]) {
        if (value != null) {
          if (typeof value === "string") {
            newValue = _protobufjs.ByteBuffer.wrap(value, "hex");
          }
        }
      }
      return this.verifyValueOriginal(newValue, skipRepeated);
    };
  }
  patched = true;
}