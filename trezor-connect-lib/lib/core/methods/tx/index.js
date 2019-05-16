'use strict';

exports.__esModule = true;
var _exportNames = {
  fixPath: true,
  convertMultisigPubKey: true
};
exports.convertMultisigPubKey = exports.fixPath = void 0;

var _hdnode = require("../../../utils/hdnode");

var _inputs = require("./inputs");

Object.keys(_inputs).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  exports[key] = _inputs[key];
});

var _outputs = require("./outputs");

Object.keys(_outputs).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  exports[key] = _outputs[key];
});

var _refTx = require("./refTx");

Object.keys(_refTx).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  exports[key] = _refTx[key];
});

var fixPath = function fixPath(utxo) {
  // make sure bip32 indices are unsigned
  if (utxo.address_n && Array.isArray(utxo.address_n)) {
    utxo.address_n = utxo.address_n.map(function (i) {
      return i >>> 0;
    });
  }

  return utxo;
};

exports.fixPath = fixPath;

var convertMultisigPubKey = function convertMultisigPubKey(network, utxo) {
  if (utxo.multisig && utxo.multisig.pubkeys) {
    // convert xpubs to HDNodeTypes
    utxo.multisig.pubkeys.forEach(function (pk) {
      if (typeof pk.node === 'string') {
        pk.node = (0, _hdnode.xpubToHDNodeType)(pk.node, network);
      }
    });
  }

  return utxo;
}; // reexport


exports.convertMultisigPubKey = convertMultisigPubKey;