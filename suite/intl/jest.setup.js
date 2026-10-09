const { TextEncoder, TextDecoder } = require('util');

// jsdom ships neither, and the @suite-common/suite-utils barrel reaches @trezor/protobuf, which
// needs them at import time.
Object.assign(global, { TextDecoder, TextEncoder });
