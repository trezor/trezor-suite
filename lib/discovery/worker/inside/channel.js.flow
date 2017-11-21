'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.startDiscoveryPromise = exports.initPromise = undefined;
exports.lookupSyncStatus = lookupSyncStatus;
exports.lookupBlockHash = lookupBlockHash;
exports.doesTransactionExist = doesTransactionExist;
exports.chunkTransactions = chunkTransactions;
exports.returnSuccess = returnSuccess;
exports.returnError = returnError;

var _deferred = require('../../../utils/deferred');

var _stream = require('../../../utils/stream');

// Code for all communication with outside

// There is a mechanism for "sending" Promise from outside here
// - first I send promiseRequest from worker to outside,
// and I either get promiseResponseSuccess or promiseResponseFailure
//
// Similar logic for Stream - I get streamRequest and
// streamResponseUpdate and streamResponseFinish
//
// It's maybe a little overkill :( but it allows me to have multiple streams
// and promises over one worker communication

var lastId = 0;

var messageEmitter = new _stream.Emitter();

function askPromise(request) {
    var id = lastId + 1;
    lastId++;
    doPostMessage({
        type: 'promiseRequest',
        request: request,
        id: id
    });
    var dfd = (0, _deferred.deferred)();
    messageEmitter.attach(function (message, detach) {
        if (message.type === 'promiseResponseSuccess') {
            if (message.response.type === request.type) {
                if (message.id === id) {
                    detach();
                    dfd.resolve(message.response.response);
                }
            }
        }
        if (message.type === 'promiseResponseFailure') {
            if (message.id === id) {
                detach();
                dfd.reject(new Error(message.failure));
            }
        }
    });
    return dfd.promise;
}

function askStream(request) {
    var id = lastId + 1;
    lastId++;
    doPostMessage({
        type: 'streamRequest',
        request: request,
        id: id
    });
    return new _stream.Stream(function (update, finish) {
        var emitterDetach = function emitterDetach() {};
        messageEmitter.attach(function (message, detach) {
            emitterDetach = detach;
            if (message.type === 'streamResponseUpdate') {
                if (message.update.type === request.type) {
                    if (message.id === id) {
                        update(message.update.response);
                    }
                }
            }
            if (message.type === 'streamResponseFinish') {
                if (message.id === id) {
                    detach();
                    finish();
                }
            }
        });
        return function () {
            emitterDetach();
        };
    });
}

function lookupSyncStatus() {
    return askPromise({ type: 'lookupSyncStatus' });
}

function lookupBlockHash(height) {
    return askPromise({ type: 'lookupBlockHash', height: height });
}

function doesTransactionExist(txid) {
    return askPromise({ type: 'doesTransactionExist', txid: txid });
}

function chunkTransactions(chainId, firstIndex, lastIndex, startBlock, endBlock, pseudoCount, addresses) {
    return askStream({
        type: 'chunkTransactions',
        chainId: chainId,
        firstIndex: firstIndex,
        lastIndex: lastIndex,
        startBlock: startBlock,
        endBlock: endBlock,
        pseudoCount: pseudoCount,
        addresses: addresses
    }).map(function (k) {
        if (typeof k === 'string') {
            return new Error(k);
        }
        return k;
    });
}

function returnSuccess(result) {
    doPostMessage({ type: 'result', result: result });
}

function returnError(error) {
    var errorMessage = error instanceof Error ? error.message : error.toString();
    doPostMessage({ type: 'error', error: errorMessage });
}

function doPostMessage(data) {
    self.postMessage(data);
}

// eslint-disable-next-line no-undef
self.onmessage = function (event) {
    var data = event.data;
    messageEmitter.emit(data);
};

var initDfd = (0, _deferred.deferred)();
var initPromise = exports.initPromise = initDfd.promise;

messageEmitter.attach(function (message, detach) {
    if (message.type === 'init') {
        detach();
        initDfd.resolve({ accountInfo: message.state, network: message.network, xpub: message.xpub, segwit: message.segwit, webassembly: message.webassembly });
    }
});

var startDiscoveryDfd = (0, _deferred.deferred)();
var startDiscoveryPromise = exports.startDiscoveryPromise = startDiscoveryDfd.promise;

messageEmitter.attach(function (message, detach) {
    if (message.type === 'startDiscovery') {
        detach();
        startDiscoveryDfd.resolve();
    }
});