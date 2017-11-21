'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getInputId = getInputId;
exports.objectValues = objectValues;
function getInputId(i) {
    var hash = i.hash;
    Array.prototype.reverse.call(hash);
    var res = hash.toString('hex');
    Array.prototype.reverse.call(hash);
    return res;
}
function objectValues(k) {
    return Object.keys(k).map(function (key) {
        return k[key];
    });
}