/* @flow */

import {Handler} from './handler';
import {patch} from './protobuf/monkey_patch';
patch();

// not sure how to do this in ES6 syntax, so I won't
module.exports = Handler;
