'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getAddressHash = exports.getAddressScriptType = exports.isScriptHash = exports.isValidAddress = void 0;

var _trezorUtxoLib = require("trezor-utxo-lib");

var _bchaddrjs = _interopRequireDefault(require("bchaddrjs"));

// Base58
var isValidBase58Address = function isValidBase58Address(address, network) {
  try {
    var decoded = _trezorUtxoLib.address.fromBase58Check(address);

    if (decoded.version !== network.pubKeyHash && decoded.version !== network.scriptHash) {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
}; // segwit native


var isValidBech32Address = function isValidBech32Address(address, network) {
  try {
    var decoded = _trezorUtxoLib.address.fromBech32(address);

    if (decoded.version !== 0 || decoded.prefix !== network.bech32) {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
}; // BCH cashaddress


var isValidCashAddress = function isValidCashAddress(address) {
  try {
    return _bchaddrjs.default.isCashAddress(address);
  } catch (err) {
    return false;
  }
};

var isValidAddress = function isValidAddress(address, coinInfo) {
  if (coinInfo.cashAddrPrefix) {
    return isValidCashAddress(address);
  } else {
    return isValidBase58Address(address, coinInfo.network) || isValidBech32Address(address, coinInfo.network);
  }
};

exports.isValidAddress = isValidAddress;

var isBech32 = function isBech32(address) {
  try {
    _trezorUtxoLib.address.fromBech32(address);

    return true;
  } catch (e) {
    return false;
  }
};

var isScriptHash = function isScriptHash(address, coinInfo) {
  if (!isBech32(address)) {
    // Cashaddr format (with prefix) is neither base58 nor bech32, so it would fail
    // in trezor-utxo-lib. For this reason, we use legacy format here
    if (coinInfo.cashAddrPrefix) {
      address = _bchaddrjs.default.toLegacyAddress(address);
    }

    var decoded = _trezorUtxoLib.address.fromBase58Check(address);

    if (decoded.version === coinInfo.network.pubKeyHash) {
      return false;
    }

    if (decoded.version === coinInfo.network.scriptHash) {
      return true;
    }
  } else {
    var _decoded = _trezorUtxoLib.address.fromBech32(address);

    if (_decoded.data.length === 20) {
      return false;
    }

    if (_decoded.data.length === 32) {
      return true;
    }
  }

  throw new Error('Unknown address type.');
};

exports.isScriptHash = isScriptHash;

var getAddressScriptType = function getAddressScriptType(address, coinInfo) {
  return isScriptHash(address, coinInfo) ? 'PAYTOSCRIPTHASH' : 'PAYTOADDRESS';
};

exports.getAddressScriptType = getAddressScriptType;

var getAddressHash = function getAddressHash(address) {
  if (isBech32(address)) return _trezorUtxoLib.address.fromBech32(address).data;
  if (isValidCashAddress(address)) return _trezorUtxoLib.address.fromBase58Check(_bchaddrjs.default.toLegacyAddress(address)).hash;
  return _trezorUtxoLib.address.fromBase58Check(address).hash;
};

exports.getAddressHash = getAddressHash;