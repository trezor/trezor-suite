if (!window.setImmediate) {
    window.setImmediate = function (callback) {
        return setTimeout(callback, 0);
    };
}

if (!window.clearImmediate) {
    window.clearImmediate = function (id) {
        clearTimeout(id);
    };
}

// jsdom 20 lacks `crypto.randomUUID` (added in jsdom 22), but RN runtime code relies on it.
const { randomUUID } = require('crypto');

if (!globalThis.crypto) {
    globalThis.crypto = { randomUUID };
} else if (!globalThis.crypto.randomUUID) {
    globalThis.crypto.randomUUID = randomUUID;
}
