// stub importScripts for the faulty detection of web worker env
if (typeof importScripts === 'undefined'
    && typeof WorkerGlobalScope !== 'undefined'
    && this instanceof WorkerGlobalScope
) {
    this.importScripts = function () {
        throw new Error('importScripts is a stub');
    };
}

// helpful script for deferred promise
function deferred() {
    var outResolve = function() {}; // will be overwritten
    var outReject = function() {}; // will be overwritten
    var promise = new Promise(function (resolve, reject) {
        outResolve = resolve;
        outReject = reject;
    });
    return {
        promise: promise,
        resolve: outResolve,
        reject: outReject,
    };
}

// prepareModule loads the wasm binary
// returns objects with the functions that you call directly and return results synchronously
function prepareModule(binary) {
    var Module = {};
    Module['wasmBinary'] = new Uint8Array(binary);
