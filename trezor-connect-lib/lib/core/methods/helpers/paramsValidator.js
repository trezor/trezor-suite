"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getFirmwareRange = exports.validateCoinPath = exports.validateParams = void 0;

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _semverCompare = _interopRequireDefault(require("semver-compare"));

var _errors = require("../../../constants/errors");

var _pathUtils = require("../../../utils/pathUtils");

var _DataManager = _interopRequireDefault(require("../../../data/DataManager"));

var validateParams = function validateParams(values, fields) {
  fields.forEach(function (field) {
    if (values.hasOwnProperty(field.name)) {
      var value = values[field.name];

      if (field.type) {
        if (field.type === 'array') {
          if (!Array.isArray(value)) {
            // invalid type
            throw (0, _errors.invalidParameter)("Parameter \"" + field.name + "\" has invalid type. \"" + field.type + "\" expected.");
          } else if (!field.allowEmpty && value.length < 1) {
            throw (0, _errors.invalidParameter)("Parameter \"" + field.name + "\" is empty.");
          }
        } else if (field.type === 'amount') {
          if (typeof value !== 'string') {
            throw (0, _errors.invalidParameter)("Parameter \"" + field.name + "\" has invalid type. \"string\" expected.");
          }

          try {
            var bn = new _bignumber.default(value);

            if (bn.toFixed(0) !== value) {
              throw new Error('');
            }
          } catch (error) {
            throw (0, _errors.invalidParameter)("Parameter \"" + field.name + "\" has invalid value \"" + value + "\". Integer representation expected.");
          }
        } else if (field.type === 'buffer') {
          if (typeof value.constructor.isBuffer === 'function' && value.constructor.isBuffer(value)) {
            throw (0, _errors.invalidParameter)("Parameter \"" + field.name + "\" has invalid type. \"buffer\" expected.");
          }
        } else if (typeof value !== field.type) {
          // invalid type
          throw (0, _errors.invalidParameter)("Parameter \"" + field.name + "\" has invalid type. \"" + field.type + "\" expected.");
        }
      }
    } else if (field.obligatory) {
      // not found
      throw (0, _errors.invalidParameter)("Parameter \"" + field.name + "\" is missing.");
    }
  });
};

exports.validateParams = validateParams;

var validateCoinPath = function validateCoinPath(coinInfo, path) {
  if (coinInfo && coinInfo.slip44 !== (0, _pathUtils.fromHardened)(path[1])) {
    throw (0, _errors.invalidParameter)('Parameters "path" and "coin" do not match.');
  }
};

exports.validateCoinPath = validateCoinPath;

var getFirmwareRange = function getFirmwareRange(method, coinInfo, current) {
  // set minimum required firmware from coins.json (coinInfo)
  if (coinInfo) {
    if (!coinInfo.support || typeof coinInfo.support.trezor1 !== 'string') {
      current['1'].min = '0';
    } else if ((0, _semverCompare.default)(coinInfo.support.trezor1, current['1'].min) > 0) {
      current['1'].min = coinInfo.support.trezor1;
    }

    if (!coinInfo.support || typeof coinInfo.support.trezor2 !== 'string') {
      current['2'].min = '0';
    } else if ((0, _semverCompare.default)(coinInfo.support.trezor2, current['2'].min) > 0) {
      current['2'].min = coinInfo.support.trezor2;
    }
  }

  var coinType = coinInfo ? coinInfo.type : null;
  var shortcut = coinInfo ? coinInfo.shortcut.toLowerCase() : null; // find firmware range in config.json

  var range = _DataManager.default.getConfig().supportedFirmware.find(function (c) {
    if (c.coinType === coinType || c.coin === shortcut) return c;

    if (c.excludedMethods && c.excludedMethods.includes(method)) {
      return c;
    }
  });

  if (range) {
    if (range.excludedMethods && !range.excludedMethods.includes(method)) {
      // not in range. do not change default range
      return current;
    }

    var min = range.min,
        max = range.max; // override defaults

    if (min) {
      if (current['1'].min === '0' || (0, _semverCompare.default)(current['1'].min, min[0]) < 0) {
        current['1'].min = min[0];
      }

      if (current['2'].min === '0' || (0, _semverCompare.default)(current['2'].min, min[1]) < 0) {
        current['2'].min = min[1];
      }
    }

    if (max) {
      if (current['1'].max === '0' || (0, _semverCompare.default)(current['1'].max, max[0]) < 0) {
        current['1'].max = max[0];
      }

      if (current['2'].max === '0' || (0, _semverCompare.default)(current['2'].max, max[1]) < 0) {
        current['2'].max = max[1];
      }
    }
  }

  return current;
};

exports.getFirmwareRange = getFirmwareRange;