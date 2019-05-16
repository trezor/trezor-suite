"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

exports.__esModule = true;
exports.xpubToHDNodeType = exports.xpubDerive = exports.convertBitcoinXpub = exports.convertXpub = void 0;

var trezor = _interopRequireWildcard(require("../types/trezor"));

var bitcoin = _interopRequireWildcard(require("trezor-utxo-lib"));

var ecurve = _interopRequireWildcard(require("ecurve"));

var curve = ecurve.getCurveByName('secp256k1');

var pubNode2bjsNode = function pubNode2bjsNode(node, network) {
  var chainCode = Buffer.from(node.chain_code, 'hex');
  var publicKey = Buffer.from(node.public_key, 'hex');

  if (curve == null) {
    throw new Error('secp256k1 is null');
  }

  var Q = ecurve.Point.decodeFrom(curve, publicKey);
  var res = new bitcoin.HDNode(new bitcoin.ECPair(null, Q, {
    network: network
  }), chainCode);
  res.depth = +node.depth;
  res.index = +node.child_num;
  res.parentFingerprint = node.fingerprint;
  return res;
};

var convertXpub = function convertXpub(xpub, originalNetwork, requestedNetwork) {
  var node = bitcoin.HDNode.fromBase58(xpub, originalNetwork);

  if (requestedNetwork) {
    node.keyPair.network = requestedNetwork;
  }

  return node.toBase58();
}; // stupid hack, because older (1.7.1, 2.0.8) trezor FW serializes all xpubs with bitcoin magic


exports.convertXpub = convertXpub;

var convertBitcoinXpub = function convertBitcoinXpub(xpub, network) {
  if (network.bip32.public === 0x0488b21e) {
    // it's bitcoin-like => return xpub
    return xpub;
  } else {
    var node = bitcoin.HDNode.fromBase58(xpub); // use bitcoin magic
    // "hard-fix" the new network into the HDNode keypair

    node.keyPair.network = network;
    return node.toBase58();
  }
}; // converts from internal PublicKey format to bitcoin.js HDNode
// network info is necessary. throws error on wrong xpub


exports.convertBitcoinXpub = convertBitcoinXpub;

var pubKey2bjsNode = function pubKey2bjsNode(key, network) {
  var keyNode = key.node;
  var bjsNode = pubNode2bjsNode(keyNode, network);
  var bjsXpub = bjsNode.toBase58();
  var keyXpub = convertXpub(key.xpub, network);

  if (bjsXpub !== keyXpub) {
    throw new Error('Invalid public key transmission detected - ' + 'invalid xpub check. ' + 'Key: ' + bjsXpub + ', ' + 'Received: ' + keyXpub);
  }

  return bjsNode;
};

var checkDerivation = function checkDerivation(parBjsNode, childBjsNode, suffix) {
  var derivedChildBjsNode = parBjsNode.derive(suffix);
  var derivedXpub = derivedChildBjsNode.toBase58();
  var compXpub = childBjsNode.toBase58();

  if (derivedXpub !== compXpub) {
    throw new Error('Invalid public key transmission detected - ' + 'invalid child cross-check. ' + 'Computed derived: ' + derivedXpub + ', ' + 'Computed received: ' + compXpub);
  }
};

var xpubDerive = function xpubDerive(xpub, childXPub, suffix, network, requestedNetwork) {
  var resNode = pubKey2bjsNode(xpub, network || bitcoin.networks.bitcoin);
  var childNode = pubKey2bjsNode(childXPub, network || bitcoin.networks.bitcoin);
  checkDerivation(resNode, childNode, suffix);
  return xpub;
};

exports.xpubDerive = xpubDerive;

var xpubToHDNodeType = function xpubToHDNodeType(xpub, network) {
  var hd = bitcoin.HDNode.fromBase58(xpub, network);
  return {
    depth: hd.depth,
    child_num: hd.index,
    fingerprint: hd.parentFingerprint,
    public_key: hd.keyPair.getPublicKeyBuffer().toString('hex'),
    chain_code: hd.chainCode.toString('hex')
  };
};

exports.xpubToHDNodeType = xpubToHDNodeType;