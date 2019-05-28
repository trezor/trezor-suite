'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var parse = function parse(versionArr) {
  if (!versionArr || versionArr.length !== 3) {
    throw Error('Wrong version arr');
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

var filterSafeListByBootloader = function filterSafeListByBootloader(_ref) {
  var releasesList = _ref.releasesList,
      bootloaderVersion = _ref.bootloaderVersion;
  return releasesList.filter(function (item) {
    return (!item.min_bootloader_version || versionUtils.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version)) && (!item.bootloader_version || versionUtils.isNewerOrEqual(item.bootloader_version, bootloaderVersion));
  });
};
var filterSafeListByFirmware = function filterSafeListByFirmware(_ref2) {
  var releasesList = _ref2.releasesList,
      firmwareVersion = _ref2.firmwareVersion;
  return releasesList.filter(function (item) {
    return versionUtils.isNewerOrEqual(firmwareVersion, item.min_firmware_version) && versionUtils.isNewer(item.version, firmwareVersion);
  });
};

var getScore = function getScore() {
  return Math.random().toFixed(2);
};
var isInProbability = function isInProbability(rollout, score) {
  var IS_IN_PROBABILITY = true;
  var IS_NOT_IN_PROBABILITY = false;
  if (score == null || Number.isNaN(score)) {
    throw new Error('score not supplied. If you want to override this functionality, just pass 0');
  }
  if (!rollout) {
    return IS_IN_PROBABILITY;
  }
  if (rollout >= score) {
    return IS_IN_PROBABILITY;
  }
  return IS_NOT_IN_PROBABILITY;
};

var getBootloaderVersion = function getBootloaderVersion(_ref) {
  var releasesList = _ref.releasesList,
      isInBootloader = _ref.isInBootloader,
      firmwareVersion = _ref.firmwareVersion,
      bootloaderVersion = _ref.bootloaderVersion;
  if (isInBootloader) {
    return bootloaderVersion;
  }
  var foundVersion = releasesList.find(function (item) {
    return versionUtils.isEqual(item.version, firmwareVersion);
  });
  if (!foundVersion || !foundVersion.bootloader_version) {
    return null;
  }
  return foundVersion.bootloader_version;
};
var getLatestSafeFw = function getLatestSafeFw(input, score) {
  var isInBootloader = input.isInBootloader,
      firmwareVersion = input.firmwareVersion,
      firmwarePresent = input.firmwarePresent;
  var releasesList = input.releasesList;
  var latest = releasesList[0];
  var isNewer;
  if (isInBootloader) {
    var bootloaderVersion = getBootloaderVersion(input);
    releasesList = filterSafeListByBootloader({
      releasesList: releasesList,
      bootloaderVersion: bootloaderVersion
    });
    if (releasesList[0] && releasesList[0].bootloader_version && versionUtils.isNewer(releasesList[0].bootloader_version, bootloaderVersion)) {
      isNewer = true;
    } else {
      isNewer = null;
    }
  } else {
    releasesList = filterSafeListByFirmware({
      releasesList: releasesList,
      firmwareVersion: firmwareVersion
    });
    var _bootloaderVersion = getBootloaderVersion(input);
    if (_bootloaderVersion) {
      releasesList = filterSafeListByBootloader({
        releasesList: releasesList,
        bootloaderVersion: _bootloaderVersion
      });
    }
    isNewer = true;
  }
  if (!releasesList.length) {
    return null;
  }
  if (firmwarePresent === false) {
    return {
      firmware: releasesList[0],
      isLatest: versionUtils.isEqual(releasesList[0].version, latest.version),
      isRequired: true,
      isNewer: true
    };
  }
  if (score != null && !Number.isNaN(score)) {
    releasesList = releasesList.filter(function (item) {
      return isInProbability(item.rollout, score);
    });
  }
  if (!releasesList.length) {
    return null;
  }
  return {
    firmware: releasesList[0],
    isLatest: versionUtils.isEqual(releasesList[0].version, latest.version),
    isRequired: releasesList.some(function (item) {
      return item.required;
    }),
    isNewer: isNewer
  };
};

exports.getLatestSafeFw = getLatestSafeFw;
exports.getScore = getScore;
