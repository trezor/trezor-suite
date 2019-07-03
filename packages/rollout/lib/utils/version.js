"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parse = function (versionArr) {
    if (!versionArr || versionArr.length !== 3) {
        throw Error('Wrong version arr');
    }
    else {
        return {
            major: versionArr[0],
            minor: versionArr[1],
            patch: versionArr[2],
        };
    }
};
var toString = function (arr) { return arr[0] + "." + arr[1] + "." + arr[2]; };
var isNewer = function (versionX, versionY) {
    var parsedX = parse(versionX);
    var parsedY = parse(versionY);
    if (parsedX.major - parsedY.major !== 0) {
        return parsedX.major > parsedY.major;
    }
    if (parsedX.minor - parsedY.minor !== 0) {
        return parsedX.minor > parsedY.minor;
    }
    if (parsedX.patch - parsedY.patch !== 0) {
        return parsedX.patch > parsedY.patch;
    }
    return false;
};
var isEqual = function (versionX, versionY) {
    return toString(versionX) === toString(versionY);
};
var isNewerOrEqual = function (versionX, versionY) {
    return isNewer(versionX, versionY) || isEqual(versionX, versionY);
};
exports.default = {
    isEqual: isEqual,
    isNewer: isNewer,
    isNewerOrEqual: isNewerOrEqual,
    parse: parse,
    toString: toString,
};
