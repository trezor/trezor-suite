'use strict';

var _handler = require('./handler');

var _monkey_patch = require('./protobuf/monkey_patch');

(0, _monkey_patch.patch)();

// not sure how to do this in ES6 syntax, so I won't
module.exports = _handler.Handler;