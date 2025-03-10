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
