'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.createTransaction = createTransaction;

var _permutation = require('./permutation');

var _bitcoinjsLibZcash = require('bitcoinjs-lib-zcash');

var _coinselect = require('./coinselect');

var coinselect = _interopRequireWildcard(_coinselect);

var _request = require('./request');

var request = _interopRequireWildcard(_request);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function inputComparator(aHash, aVout, bHash, bVout) {
    return reverseBuffer(aHash).compare(reverseBuffer(bHash)) || aVout - bVout;
}

function outputComparator(aScript, aValue, bScript, bValue) {
    return aValue - bValue || aScript.compare(bScript);
}

// types for building the transaction in trezor.js
function createTransaction(allInputs, selectedInputs, allOutputs, selectedOutputs, segwit, inputAmounts, basePath, changeId, changeAddress, network) {
    var convertedInputs = selectedInputs.map(function (input) {
        var id = input.id;
        var richInput = allInputs[id];
        return convertInput(richInput, segwit, inputAmounts, basePath);
    });
    var convertedOutputs = selectedOutputs.map(function (output, i) {
        // change is always last
        var isChange = i === allOutputs.length;

        var original = allOutputs[i]; // null if change

        if (!isChange && original.type === 'opreturn') {
            var _opReturnData = original.dataHex;
            return convertOpReturnOutput(_opReturnData);
        } else {
            // TODO refactor and get rid of FlowIssues everywhere
            // $FlowIssue
            var _address = isChange ? changeAddress : original.address;
            var _amount = output.value;
            return convertOutput(_address, _amount, network, basePath, changeId, isChange, segwit);
        }
    });
    convertedInputs.sort(function (a, b) {
        return inputComparator(a.hash, a.index, b.hash, b.index);
    });
    var permutedOutputs = _permutation.Permutation.fromFunction(convertedOutputs, function (a, b) {
        // $FlowIssue
        var aValue = a.output.value != null ? a.output.value : 0;
        // $FlowIssue
        var bValue = b.output.value != null ? b.output.value : 0;
        return outputComparator(a.script, aValue, b.script, bValue);
    }).map(function (o) {
        return o.output;
    });
    return {
        inputs: convertedInputs,
        outputs: permutedOutputs
    };
}

function convertInput(utxo, segwit, inputAmounts, basePath) {
    var res = {
        hash: reverseBuffer(new Buffer(utxo.transactionHash, 'hex')),
        index: utxo.index,
        path: basePath.concat([].concat(_toConsumableArray(utxo.addressPath))),
        segwit: segwit
    };
    if (inputAmounts) {
        return _extends({}, res, {
            amount: utxo.value
        });
    }
    return res;
}

function convertOpReturnOutput(opReturnData) {
    var opReturnDataBuffer = new Buffer(opReturnData, 'hex');
    var output = {
        opReturnData: opReturnDataBuffer
    };
    // $FlowIssue
    var script = _bitcoinjsLibZcash.script.nullData.output.encode(opReturnDataBuffer);
    return {
        output: output,
        script: script
    };
}

function convertOutput(address, value, network, basePath, changeId, isChange, segwit) {
    var output = isChange ? {
        path: [].concat(_toConsumableArray(basePath), [1, changeId]),
        segwit: segwit,
        value: value
    } : {
        address: address,
        value: value
    };

    return {
        output: output,
        script: _bitcoinjsLibZcash.address.toOutputScript(address, network)
    };
}

function reverseBuffer(src) {
    var buffer = new Buffer(src.length);
    for (var i = 0, j = src.length - 1; i <= j; ++i, --j) {
        buffer[i] = src[j];
        buffer[j] = src[i];
    }
    return buffer;
}