"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getLatestRelease = exports.checkFirmware = exports.parseFirmware = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var releases = [];

var parseFirmware = function parseFirmware(json) {
  var obj = json;
  Object.keys(obj).forEach(function (key) {
    var release = obj[key];
    releases.push((0, _objectSpread2.default)({}, release));
  });
};

exports.parseFirmware = parseFirmware;

var checkFirmware = function checkFirmware(fw, features) {
  // indication that firmware is not installed at all. This information is set to false in bl mode. Otherwise it is null.
  if (features.firmware_present === false) {
    return 'none';
  } // for t1 in bootloader, what device reports as firmware version is in fact bootloader version, so we can
  // not safely tell firmware version


  if (fw[0] === 1 && features.bootloader_mode) {
    return 'unknown';
  } // find all releases for device model


  var modelFirmware = releases.filter(function (r) {
    return r.version[0] === fw[0];
  }); // find latest firmware for this model

  var latestFirmware = modelFirmware.filter(function (r) {
    return r.version[1] > fw[1] || r.version[1] === fw[1] && r.version[2] > fw[2];
  });

  if (latestFirmware.length > 0) {
    // check if any of releases is required
    var requiredFirmware = latestFirmware.find(function (r) {
      return r.required;
    });

    if (requiredFirmware) {
      return 'required';
    } else {
      return 'outdated';
    }
  }

  return 'valid';
};

exports.checkFirmware = checkFirmware;

var getLatestRelease = function getLatestRelease(fw) {
  // find all releases for device model
  var modelFirmware = releases.filter(function (r) {
    return r.version[0] === fw[0];
  }); // find latest firmware for this model

  return modelFirmware.find(function (r) {
    return r.version[1] > fw[1] || r.version[1] === fw[1] && r.version[2] > fw[2];
  });
};

exports.getLatestRelease = getLatestRelease;