"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.RippleWorker = exports.SocketWorker = exports.DiscoveryWorker = exports.FastXpubWorker = exports.FastXpubWasm = exports.SharedConnectionWorker = void 0;

var _path = _interopRequireDefault(require("path"));

var _tinyWorker = _interopRequireDefault(require("tiny-worker"));

var SharedConnectionWorker = function SharedConnectionWorker() {
  return null;
};

exports.SharedConnectionWorker = SharedConnectionWorker;

var FastXpubWasm = _path.default.resolve(process.cwd(), './node_modules/hd-wallet/lib/fastxpub/fastxpub.wasm');

exports.FastXpubWasm = FastXpubWasm;
;

var FastXpubWorker = function FastXpubWorker() {
  return new _tinyWorker.default(function () {
    require('hd-wallet/lib/fastxpub/fastxpub');
  });
};

exports.FastXpubWorker = FastXpubWorker;

var DiscoveryWorker = function DiscoveryWorker() {
  return new _tinyWorker.default(function () {
    require('hd-wallet/lib/discovery/worker/inside');
  });
};

exports.DiscoveryWorker = DiscoveryWorker;

var SocketWorker = function SocketWorker() {
  return new _tinyWorker.default(function () {
    require('hd-wallet/lib/socketio-worker/inside');
  });
};

exports.SocketWorker = SocketWorker;

var RippleWorker = function RippleWorker() {
  return new _tinyWorker.default(function () {
    require('trezor-blockchain-link/lib/workers/ripple/index');
  });
};

exports.RippleWorker = RippleWorker;