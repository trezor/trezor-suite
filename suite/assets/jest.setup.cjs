const { TextDecoder, TextEncoder } = require('node:util');

Object.assign(globalThis, { TextDecoder, TextEncoder });
