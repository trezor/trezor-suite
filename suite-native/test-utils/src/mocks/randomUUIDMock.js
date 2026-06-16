const { randomUUID } = require('crypto');

// jsdom's crypto does not expose randomUUID; patch it using Node's built-in.
if (typeof global.crypto !== 'undefined' && !global.crypto.randomUUID) {
    global.crypto.randomUUID = randomUUID;
}
