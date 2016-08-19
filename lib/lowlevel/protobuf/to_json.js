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

Function.prototype.$asyncbind = function $asyncbind(self, catcher) {
  var resolver = this;

  if (catcher === true) {
    if (!Function.prototype.$asyncbind.EagerThenable) Function.prototype.$asyncbind.EagerThenable = function factory(tick) {
      var _tasks = [];

      if (!tick) {
        try {
          tick = process.nextTick;
        } catch (ex) {
          tick = function tick(p) {
            setTimeout(p, 0);
          };
        }
      }

      function _untask() {
        for (var i = 0; i < _tasks.length; i += 2) {
          var t = _tasks[i + 1],
              r = _tasks[i];

          for (var j = 0; j < t.length; j++) t[j].call(null, r);
        }

        _tasks = [];
      }

      function isThenable(obj) {
        return obj && obj instanceof Object && typeof obj.then === "function";
      }

      function EagerThenable(resolver) {
        function done(inline) {
          var w;
          if (_sync || phase < 0 || (w = _thens[phase]).length === 0) return;

          _tasks.push(result, w);

          _thens = [[], []];
          if (_tasks.length === 2) inline ? _untask() : tick(_untask);
        }

        function resolveThen(x) {
          if (isThenable(x)) return x.then(resolveThen, rejectThen);
          phase = 0;
          result = x;
          done(true);
        }

        function rejectThen(x) {
          if (isThenable(x)) return x.then(resolveThen, rejectThen);
          phase = 1;
          result = x;
          done(true);
        }

        function settler(resolver, rejecter) {
          _thens[0].push(resolver);

          _thens[1].push(rejecter);

          done();
        }

        function toString() {
          return "EagerThenable{" + {
            "-1": "pending",
            0: "resolved",
            1: "rejected"
          }[phase] + "}=" + result.toString();
        }

        this.then = settler;
        this.toString = toString;
        var _thens = [[], []],
            _sync = true,
            phase = -1,
            result;
        resolver.call(null, resolveThen, rejectThen);
        _sync = false;
        done();
      }

      EagerThenable.resolve = function (v) {
        return isThenable(v) ? v : {
          then: function then(resolve, reject) {
            return resolve(v);
          }
        };
      };

      return EagerThenable;
    }();
    return new Function.prototype.$asyncbind.EagerThenable(boundThen);
  }

  if (catcher) {
    if (Function.prototype.$asyncbind.wrapAsyncStack) catcher = Function.prototype.$asyncbind.wrapAsyncStack(catcher);
    return then;
  }

  function then(result, error) {
    try {
      return result && result instanceof Object && typeof result.then === "function" ? result.then(then, catcher) : resolver.call(self, result, error || catcher);
    } catch (ex) {
      return (error || catcher)(ex);
    }
  }

  function boundThen(result, error) {
    return resolver.call(self, result, error);
  }

  boundThen.then = boundThen;
  return boundThen;
};

if (!Object.values) {
  (0, _object.shim)();
}

function protocolToJSON(p) {
  // TODO: what if there are more files?
  const res = fileToJSON(p.file[2]);
  res.imports = [fileToJSON(p.file[1])];
  return res;
}

function fileToJSON(f) {
  const res = {};
  res.package = f.package;
  res.options = f.options;
  res.services = [];
  const messagesSimple = Object.values(f.message_type).map(messageToJSON);
  const messagesRef = extensionToJSON(f.extension);
  res.messages = messagesRef.concat(messagesSimple);
  res.enums = Object.values(f.enum_type).map(enumToJSON);
  return res;
}

function enumToJSON(enumm) {
  const res = {};
  res.name = enumm.name;
  res.values = Object.values(enumm.value).map(enum_valueToJSON);
  res.options = {};
  return res;
}

function extensionToJSON(extensions) {
  const res = {};
  Object.values(extensions).forEach(function (extension) {
    const extendee = extension.extendee.slice(1);
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
  const res = {};
  res.name = val.name;
  res.id = val.number;
  return res;
}

function messageToJSON(message) {
  const res = {};
  res.enums = [];
  res.name = message.name;
  res.options = message.options || {};
  res.messages = [];
  res.fields = Object.values(message.field).map(fieldToJSON);
  res.oneofs = {};
  return res;
}

const type_map = {
  "1": `double`,
  "2": `float`,
  "3": `int64`,
  "4": `uint64`,
  "5": `int32`,
  "6": `fixed64`,
  "7": `fixed32`,
  "8": `bool`,
  "9": `string`,
  "10": `group`,
  "11": `message`,
  "12": `bytes`,
  "13": `uint32`,
  "14": `enum`,
  "15": `sfixed32`,
  "16": `sfixed64`,
  "17": `sint32`,
  "18": `sint64`
};

function fieldToJSON(field) {
  const res = {};
  if (field.label === 1) {
    res.rule = `optional`;
  }
  if (field.label === 2) {
    res.rule = `required`;
  }
  if (field.label === 3) {
    res.rule = `repeated`;
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