'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var Version =
/*#__PURE__*/
function () {
  function Version(major, minor, patch) {
    _classCallCheck(this, Version);

    this.major = major || 0;
    this.minor = minor || 0;
    this.patch = patch || 0;
  }

  _createClass(Version, [{
    key: "toString",
    value: function toString() {
      return [this.major.toString(), this.minor.toString(), this.patch.toString()].join('.');
    }
  }, {
    key: "isNewer",
    value: function isNewer(other) {
      var result;

      if (this.major - other.major !== 0) {
        result = this.major > other.major;
      }

      if (this.minor - other.minor !== 0) {
        result = this.minor > other.minor;
      }

      if (this.patch - other.patch !== 0) {
        result = this.patch > other.patch;
      }

      return result;
    }
  }, {
    key: "isEqual",
    value: function isEqual(version) {
      return this.major === version.major && this.minor === version.minor && this.patch === version.patch;
    }
  }, {
    key: "isNewerOrEqual",
    value: function isNewerOrEqual(version) {
      return this.isNewer(version) || this.isEqual(version);
    }
  }], [{
    key: "fromArray",
    value: function fromArray(arr) {
      if (arr == null) {
        throw new Error('Unexpected null.');
      }

      if (arr.length !== 3) {
        throw new Error("Array version length isn't 3");
      }

      return new Version(arr[0], arr[1], arr[2]);
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      if (str == null) {
        throw new Error('Unexpected null.');
      }

      var strArr = str.split('.');
      var numArr = strArr.map(function (n) {
        return parseInt(n, 10);
      });
      return Version.fromArray(numArr);
    }
  }]);

  return Version;
}();

/**
 * Helper class, telling all info about concrete firmware
 */

var FirmwareInfo =
/*#__PURE__*/
function () {
  function FirmwareInfo(o) {
    _classCallCheck(this, FirmwareInfo);

    this.required = o.required;
    this.url = o.url;
    this.prefilledData = o.prefilledData;
    this.fingerprint = o.fingerprint.toLowerCase();
    this.changelog = o.changelog;
    this.notes = o.notes;
    this.min_bridge_version = Version.fromArray(o.min_bridge_version);
    this.min_bootloader_version = Version.fromArray(o.min_bootloader_version);
    this.min_firmware_version = Version.fromArray(o.min_firmware_version);
    this.version = Version.fromArray(o.version);
    this.rollout = o.rollout;

    if (o.bootloader_version) {
      this.bootloader_version = Version.fromArray(o.bootloader_version);
    }
  }

  _createClass(FirmwareInfo, [{
    key: "isCustom",
    get: function get() {
      return !!this.prefilledData;
    }
  }]);

  return FirmwareInfo;
}();

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
    var blVersion = new Version(features.major_version, features.minor_version, features.patch_version); // incremental safety check. bootloader version must be higher
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
  //-- 2.a if device is connected in bootloader mode
  // todo: tohle je asi to same jako 1. uplne


  if (features.bootloader_mode === true) {
    var _blVersion = new Version(features.major_version, features.minor_version, features.patch_version);

    list = list.filter(function (fw) {
      return _blVersion.isNewerOrEqual(fw.bootloader_version);
    });
  }

  return list[0];
};

exports.getLatestFw = getLatestFw;
exports.getListForModel = getListForModel;
exports.getLatestSafeFw = getLatestSafeFw;
