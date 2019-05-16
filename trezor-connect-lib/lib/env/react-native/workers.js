'use strict';

let _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

exports.__esModule = true;
exports.RippleWorker = exports.SocketWorker = exports.DiscoveryWorker = exports.FastXpubWorker = exports.FastXpubWasm = exports.SharedConnectionWorker = void 0;

// var _reactNativeThreads = require("react-native-threads");

// var _index = _interopRequireDefault(require("worker-loader?name=js/ripple-worker.js!react-native-worker!trezor-blockchain-link/lib/workers/ripple/index.js"));

// webpack needs to compile and export those files

/* eslint-disable no-unused-vars */
// import FastXpubWasmLoader from 'hd-wallet/lib/fastxpub/fastxpub.wasm';
// import FastXpubWorkerLoader from 'worker-loader?name=js/fastxpub-worker.js!hd-wallet/lib/fastxpub/fastxpub.js';
// import DiscoveryWorkerLoader from 'worker-loader?name=js/discovery-worker.js!hd-wallet/lib/discovery/worker/inside';
// import SocketWorkerLoader from 'worker-loader?name=js/socketio-worker.js!hd-wallet/lib/socketio-worker/inside';
// import RippleWorkerLoader from 'worker-loader?name=js/ripple-worker.js!trezor-blockchain-link/lib/workers/ripple/index.js';
// import RippleWorkerLoader from 'worker-loader?name=js/ripple-worker.js!react-native-worker!trezor-blockchain-link/lib/workers/ripple/index.js';

/* eslint-enable no-unused-vars */
// import DiscoveryWorkerL from 'react-native-worker!hd-wallet/lib/discovery/worker/inside';
// import SocketWorkerL from 'react-native-worker?name=js/socketio-worker.js!hd-wallet/lib/socketio-worker/inside';
let SharedConnectionWorker = function SharedConnectionWorker() {
    // return 'not-used-in-react-native.js';
};

exports.SharedConnectionWorker = SharedConnectionWorker;
let FastXpubWasm = './js/fastxpub.wasm';
exports.FastXpubWasm = FastXpubWasm;

let FastXpubWorker = function FastXpubWorker() {
    // return new Thread('./fastxpub-worker.js');
};

exports.FastXpubWorker = FastXpubWorker;

let DiscoveryWorker = function DiscoveryWorker() {
    // return new Thread('./discovery-worker.js');
};

exports.DiscoveryWorker = DiscoveryWorker;

let SocketWorker = function SocketWorker() {
    // return new Thread('./socketio-worker.js');
};

exports.SocketWorker = SocketWorker;

let RippleWorker = function RippleWorker() {
    // return new RippleWorkerL();
    // return new _reactNativeThreads.Thread('./packages/native/trezor-connect/js/ripple-worker.js');
};

exports.RippleWorker = RippleWorker;
