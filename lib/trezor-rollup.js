'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var parse = function parse(versionArr) {
  if (versionArr.length !== 3) {
    throw Error('Wrong version string');
  } else {
    return {
      major: versionArr[0],
      minor: versionArr[1],
      patch: versionArr[2]
    };
  }
};
var toString = function toString(arr) {
  return "".concat(arr[0], ".").concat(arr[1], ".").concat(arr[2]);
};
var isNewer = function isNewer(versionX, versionY) {
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
var isEqual = function isEqual(versionX, versionY) {
  return toString(versionX) === toString(versionY);
};
var isNewerOrEqual = function isNewerOrEqual(versionX, versionY) {
  return isNewer(versionX, versionY) || isEqual(versionX, versionY);
};
var versionUtils = {
  isEqual: isEqual,
  isNewer: isNewer,
  isNewerOrEqual: isNewerOrEqual,
  parse: parse,
  toString: toString
};

var findNextBootloader = function findNextBootloader(list, bootloaderVersion) {
  return list.reverse().find(function (item) {
    return versionUtils.isNewer(item.min_bootloader_version, bootloaderVersion);
  });
};
var filterBootloader = function filterBootloader(list, bootloaderVersion) {
  return list.filter(function (item) {
    return versionUtils.isEqual(item.min_bootloader_version, bootloaderVersion);
  });
};
var findNextFirmware = function findNextFirmware(list, firmwareVersion) {
  return list.reverse().find(function (item) {
    return versionUtils.isNewer(item.min_firmware_version, firmwareVersion);
  });
};
var filterFirmware = function filterFirmware(list, firmwareVersion) {
  return list.filter(function (item) {
    return versionUtils.isEqual(item.min_firmware_version, firmwareVersion);
  });
};

var getLatestSafeFw = function getLatestSafeFw(input) {
  var releasesList = input.releasesList,
      isInBootloader = input.isInBootloader,
      firmwareVersion = input.firmwareVersion,
      bootloaderVersion = input.bootloaderVersion;
  if (!isInBootloader && !firmwareVersion) {
    return releasesList[0];
  }
  if (isInBootloader) {
    var _next = findNextBootloader(releasesList, bootloaderVersion);
    if (!_next) {
      return [];
    }
    var _nextPossibleVersions = filterBootloader(releasesList, _next.min_bootloader_version);
    return _nextPossibleVersions[0];
  }
  var next = findNextFirmware(releasesList, firmwareVersion);
  if (!next) {
    return [];
  }
  var nextPossibleVersions = filterFirmware(releasesList, next.min_firmware_version);
  return nextPossibleVersions[0];
};
var getScore = function getScore() {
  return Math.random().toFixed(2);
};

exports.getLatestSafeFw = getLatestSafeFw;
exports.getScore = getScore;
