'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// this is converting in/to coinselect format
//
// I am using the coinselect format, since the end-goal is
// to merge the changes back to upstream; it didn't work out so far


exports.coinselect = coinselect;

var _split = require('./coinselect-lib/outputs/split');

var _split2 = _interopRequireDefault(_split);

var _coinselectLib = require('./coinselect-lib');

var _coinselectLib2 = _interopRequireDefault(_coinselectLib);

var _utils = require('./coinselect-lib/utils');

var _request = require('./request');

var request = _interopRequireWildcard(_request);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SEGWIT_INPUT_SCRIPT_LENGTH = 51; // actually 50.25, but let's make extra room
var INPUT_SCRIPT_LENGTH = 109;
var OUTPUT_SCRIPT_LENGTH = 25;

function coinselect(utxos, rOutputs, height, feeRate, segwit, countMax, countMaxId, dustThreshold) {
    var inputs = convertInputs(utxos, height, segwit);
    var outputs = convertOutputs(rOutputs);
    var options = {
        inputLength: segwit ? SEGWIT_INPUT_SCRIPT_LENGTH : INPUT_SCRIPT_LENGTH,
        outputLength: OUTPUT_SCRIPT_LENGTH,
        dustThreshold: dustThreshold
    };

    var algorithm = countMax ? _split2.default : _coinselectLib2.default;
    var result = algorithm(inputs, outputs, feeRate, options);
    if (!result.inputs) {
        return {
            type: 'false'
        };
    } else {
        var _fee = result.fee;
        var _max = countMaxId === -1 ? -1 : result.outputs[countMaxId].value;

        var _totalSpent = result.outputs.filter(function (output, i) {
            // change is always last and additional one
            return i !== rOutputs.length;
        }).map(function (o) {
            return o.value;
        }).reduce(function (a, b) {
            return a + b;
        }, 0) + result.fee;

        var allSize = (0, _utils.transactionBytes)(result.inputs, result.outputs);
        var _feePerByte = _fee / allSize;
        return {
            type: 'true',
            result: _extends({}, result, {
                feePerByte: _feePerByte,
                bytes: allSize,
                max: _max,
                totalSpent: _totalSpent
            })
        };
    }
}

function convertInputs(inputs, height, segwit) {
    var bytesPerInput = segwit ? SEGWIT_INPUT_SCRIPT_LENGTH : INPUT_SCRIPT_LENGTH;
    return inputs.map(function (input, i) {
        return {
            id: i,
            script: { length: bytesPerInput },
            value: input.value,
            own: input.own,
            coinbase: input.coinbase,
            confirmations: input.height == null ? 0 : 1 + height - input.height
        };
    });
}

function convertOutputs(outputs) {
    var script = { length: OUTPUT_SCRIPT_LENGTH };
    return outputs.map(function (output) {
        if (output.type === 'complete' || output.type === 'noaddress') {
            return {
                value: output.amount,
                script: script
            };
        }
        if (output.type === 'opreturn') {
            return {
                value: 0,
                script: { length: 2 + output.dataHex.length / 2 }
            };
        }
        if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
            return {
                script: script
            };
        }
        throw new Error('WRONG-OUTPUT-TYPE');
    });
}