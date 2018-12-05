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

var getSafeBootloaderVersions = function getSafeBootloaderVersions(list, bootloaderVersion) {
  return list.filter(function (item) {
    return versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version);
  });
};
var getSafeFirmwareVersions = function getSafeFirmwareVersions(list, firmwareVersion) {
  return list.filter(function (item) {
    return versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version);
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
    var safeBootloadersList = getSafeBootloaderVersions(releasesList, bootloaderVersion).filter(function (item) {
      return versionUtils.isNewerOrEqual((item.bootloader_version || [1, 7, 0], bootloaderVersion));
    });
    return safeBootloadersList[0] || [];
  }
  if (!isInBootloader) {
    var safeFirmwareVersions = getSafeFirmwareVersions(releasesList, firmwareVersion);
    return safeFirmwareVersions[0];
  }
  return [];
};
var getScore = function getScore() {
  var score = 'score';
  return score;
};

exports.getLatestSafeFw = getLatestSafeFw;
exports.getScore = getScore;
