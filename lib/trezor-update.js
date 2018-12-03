'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var helpers = require('helpers');

var _this = undefined;

var getLatestFw = function getLatestFw(features) {
  var list = getListForModel(features.major_version);
  return list[0];
};

var getListForModel = function getListForModel(model) {
  var int = parseInt(model, 10);

  switch (int) {
    case 1:
      return _this.firmwareList1;

    case 2:
      return _this.firmwareList2;

    default:
      throw new Error('Wrong model param');
  }
};

var getLatestSafeFw = function getLatestSafeFw(features) {
  var list = getListForModel(features.major_version); // 1. handle if no firmware is present at all

  if (features.firmware_present === false) {
    // without firmware, what we see is bootloader version
    var blVersion = new helpers.Version(features.major_version, features.minor_version, features.patch_version); // incremental safety check. bootloader version must be higher
    // or equal then min_bootloader_version of firmware that is to be installed

    list = list.filter(function (fw) {
      return blVersion.isNewerOrEqual(fw.min_bootloader_version);
    }); // safeFw here is the highest version of firmware, but its bootloader
    // version must not be lower then current bl version

    var safeFw = list.find(function (possibleFw) {
      if (possibleFw.min_bootloader_version) {
        return blVersion.isNewerOrEqual(possibleFw.min_bootloader_version);
      }

      return possibleFw;
    }); // todo: implement incremental safety check;

    return safeFw;
  } // 2. handle situation when firmware is already installed
  // -- 2.a if device is connected in bootloader mode
  // todo: tohle je asi to same jako 1. uplne


  if (features.bootloader_mode === true) {
    var _blVersion = new helpers.Version(features.major_version, features.minor_version, features.patch_version);

    list = list.filter(function (fw) {
      return _blVersion.isNewerOrEqual(fw.bootloader_version);
    });
  }

  return list[0];
};

exports.getLatestFw = getLatestFw;
exports.getListForModel = getListForModel;
exports.getLatestSafeFw = getLatestSafeFw;
