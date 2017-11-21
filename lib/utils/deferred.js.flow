"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.deferred = deferred;
function deferred() {
    var outResolve = function outResolve(t) {};
    var outReject = function outReject(e) {};
    var promise = new Promise(function (resolve, reject) {
        outResolve = resolve;
        outReject = reject;
    });
    return {
        promise: promise,
        resolve: outResolve,
        reject: outReject
    };
}