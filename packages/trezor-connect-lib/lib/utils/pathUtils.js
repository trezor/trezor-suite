"use strict";

exports.__esModule = true;
exports.getLabel = exports.getPublicKeyLabel = exports.getAccountLabel = exports.getIndexFromPath = exports.getPathFromIndex = exports.getSerializedPath = exports.validatePath = exports.getOutputScriptType = exports.getScriptType = exports.isBech32Path = exports.isSegwitPath = exports.isMultisigPath = exports.getHDPath = exports.fromHardened = exports.toHardened = exports.HD_HARDENED = void 0;

var _CoinInfo = require("../data/CoinInfo");

var _errors = require("../constants/errors");

var HD_HARDENED = 0x80000000;
exports.HD_HARDENED = HD_HARDENED;

var toHardened = function toHardened(n) {
  return (n | HD_HARDENED) >>> 0;
};

exports.toHardened = toHardened;

var fromHardened = function fromHardened(n) {
  return (n & ~HD_HARDENED) >>> 0;
};

exports.fromHardened = fromHardened;
var PATH_NOT_VALID = (0, _errors.invalidParameter)('Not a valid path.');
var PATH_NEGATIVE_VALUES = (0, _errors.invalidParameter)('Path cannot contain negative values.');

var getHDPath = function getHDPath(path) {
  var parts = path.toLowerCase().split('/');
  if (parts[0] !== 'm') throw PATH_NOT_VALID;
  return parts.filter(function (p) {
    return p !== 'm' && p !== '';
  }).map(function (p) {
    var hardened = false;

    if (p.substr(p.length - 1) === "'") {
      hardened = true;
      p = p.substr(0, p.length - 1);
    }

    var n = parseInt(p);

    if (isNaN(n)) {
      throw PATH_NOT_VALID;
    } else if (n < 0) {
      throw PATH_NEGATIVE_VALUES;
    }

    if (hardened) {
      // hardened index
      n = toHardened(n);
    }

    return n;
  });
};

exports.getHDPath = getHDPath;

var isMultisigPath = function isMultisigPath(path) {
  return Array.isArray(path) && path[0] === toHardened(48);
};

exports.isMultisigPath = isMultisigPath;

var isSegwitPath = function isSegwitPath(path) {
  return Array.isArray(path) && path[0] === toHardened(49);
};

exports.isSegwitPath = isSegwitPath;

var isBech32Path = function isBech32Path(path) {
  return Array.isArray(path) && path[0] === toHardened(84);
};

exports.isBech32Path = isBech32Path;

var getScriptType = function getScriptType(path) {
  if (!Array.isArray(path) || path.length < 1) return 'SPENDADDRESS';
  var p1 = fromHardened(path[0]);

  switch (p1) {
    case 48:
      return 'SPENDMULTISIG';

    case 49:
      return 'SPENDP2SHWITNESS';

    case 84:
      return 'SPENDWITNESS';

    default:
      return 'SPENDADDRESS';
  }
};

exports.getScriptType = getScriptType;

var getOutputScriptType = function getOutputScriptType(path) {
  if (!Array.isArray(path) || path.length < 1) return 'PAYTOADDRESS';
  var p = fromHardened(path[0]);

  switch (p) {
    case 48:
      return 'PAYTOMULTISIG';

    case 49:
      return 'PAYTOP2SHWITNESS';

    case 84:
      return 'PAYTOWITNESS';

    default:
      return 'PAYTOADDRESS';
  }
};

exports.getOutputScriptType = getOutputScriptType;

var validatePath = function validatePath(path, length, base) {
  if (length === void 0) {
    length = 0;
  }

  if (base === void 0) {
    base = false;
  }

  var valid;

  if (typeof path === 'string') {
    valid = getHDPath(path);
  } else if (Array.isArray(path)) {
    valid = path.map(function (p) {
      var n = parseInt(p);

      if (isNaN(n)) {
        throw PATH_NOT_VALID;
      } else if (n < 0) {
        throw PATH_NEGATIVE_VALUES;
      }

      return n;
    });
  }

  if (!valid) throw PATH_NOT_VALID;
  if (length > 0 && valid.length < length) throw PATH_NOT_VALID;
  return base ? valid.splice(0, 3) : valid;
};

exports.validatePath = validatePath;

var getSerializedPath = function getSerializedPath(path) {
  return 'm/' + path.map(function (i) {
    var s = (i & ~HD_HARDENED).toString();

    if (i & HD_HARDENED) {
      return s + "'";
    } else {
      return s;
    }
  }).join('/');
};

exports.getSerializedPath = getSerializedPath;

var getPathFromIndex = function getPathFromIndex(bip44purpose, bip44cointype, index) {
  return [toHardened(bip44purpose), toHardened(bip44cointype), toHardened(index)];
};

exports.getPathFromIndex = getPathFromIndex;

var getIndexFromPath = function getIndexFromPath(path) {
  if (path.length < 3) {
    throw (0, _errors.invalidParameter)("getIndexFromPath: invalid path length " + path.toString());
  }

  return fromHardened(path[2]);
};

exports.getIndexFromPath = getIndexFromPath;

var getAccountLabel = function getAccountLabel(path, coinInfo) {
  var coinLabel = coinInfo.label;
  var p1 = fromHardened(path[0]);
  var account = fromHardened(path[2]);
  var realAccountId = account + 1;
  var prefix = 'Export info of';
  var accountType = '';

  if (p1 === 48) {
    accountType = coinLabel + " multisig";
  } else if (p1 === 44 && coinInfo.segwit) {
    accountType = coinLabel + " legacy";
  } else {
    accountType = coinLabel;
  }

  return prefix + " " + accountType + " <span>account #" + realAccountId + "</span>";
};

exports.getAccountLabel = getAccountLabel;

var getPublicKeyLabel = function getPublicKeyLabel(path, coinInfo) {
  var hasSegwit = false;
  var coinLabel = 'Unknown coin';

  if (coinInfo) {
    coinLabel = coinInfo.label;
    hasSegwit = coinInfo.segwit;
  } else {
    coinLabel = (0, _CoinInfo.getCoinName)(path);
  }

  var p1 = fromHardened(path[0]);
  var account = path.length >= 3 ? fromHardened(path[2]) : -1;
  var realAccountId = account + 1;
  var prefix = 'Export public key';
  var accountType = ''; // Copay id

  if (p1 === 45342) {
    var p2 = fromHardened(path[1]);
    account = fromHardened(path[3]);
    realAccountId = account + 1;
    prefix = 'Export Copay ID of';

    if (p2 === 48) {
      accountType = 'multisig';
    } else if (p2 === 44) {
      accountType = 'legacy';
    }
  } else if (p1 === 48) {
    accountType = coinLabel + " multisig";
  } else if (p1 === 44 && hasSegwit) {
    accountType = coinLabel + " legacy";
  } else if (p1 === 84 && hasSegwit) {
    accountType = coinLabel + " native segwit";
  } else {
    accountType = coinLabel;
  }

  if (realAccountId > 0) {
    return prefix + " of " + accountType + " <span>account #" + realAccountId + "</span>";
  } else {
    return prefix;
  }
};

exports.getPublicKeyLabel = getPublicKeyLabel;

var getLabel = function getLabel(label, coinInfo) {
  if (coinInfo) {
    return label.replace('#NETWORK', coinInfo.label);
  }

  return label.replace('#NETWORK', '');
};

exports.getLabel = getLabel;