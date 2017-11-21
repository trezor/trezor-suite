'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.deriveAnalysis = deriveAnalysis;

var _utils = require('../utils');

var _dates = require('./dates');

var _bitcoinjsLibZcash = require('bitcoinjs-lib-zcash');

// Pretty complicated function for deriving transaction analysis.
//
// Transaction analysis is a little heuristic - I have transactions and I try
// to find out which are "positive" and which are "negative"
// and which outputs to "display to user"
//
// Also, what is the "effective balance" of the transaction
//
// I do not re-analyze old transactions, I just analyze new transactions

function deriveAnalysis(newTransactions, oldTransactions, addressToPath) {
    // I need the outputs in format txid+i -> address/value
    // For old transactions, that are in history, I just need my outputs
    // For new transactions, I need all outputs (I will be analyzing them)
    var outputsForAnalysis = deriveOutputsForAnalysisMap(newTransactions, oldTransactions);

    // For each tx, derive info about its impact,
    // but since we don't know order, we don't know balance after it
    var analysis = deriveBalancelessAnalysisMap(newTransactions, oldTransactions, outputsForAnalysis, addressToPath);

    // Add "balance" (which means balance after the transaction)
    var transactions = deriveFullInfo(analysis);
    return transactions;
}

// All info about outputs
function deriveOutputsForAnalysisMap(newTs, oldTs) {
    // Take only my outputs from old
    function getOutputsFromOldTransaction(t) {
        var outputs = [];
        Object.keys(t.myOutputs).forEach(function (i) {
            outputs[parseInt(i)] = t.myOutputs[parseInt(i)];
        });
        var txid = t.hash;
        return { txid: txid, outputs: outputs };
    }

    // take all info from new txs, since I will be going throug them 1 by 1
    function getOutputsFromNewTransaction(t) {
        var outputs = [];
        for (var _i = 0; _i < t.tx.outs.length; _i++) {
            var output = t.tx.outs[_i];
            var _address = t.outputAddresses[_i];
            outputs.push({ address: _address, value: output.value });
        }
        var txid = t.hash;
        return { txid: txid, outputs: outputs };
    }

    var res = {};
    var newOutputs = (0, _utils.objectValues)(newTs).map(function (t) {
        return getOutputsFromNewTransaction(t);
    });
    var oldOutputs = oldTs.map(function (t) {
        return getOutputsFromOldTransaction(t);
    });

    // new txs are replacing the old ones
    // (rare case - new tx can have new address "discovered")
    oldOutputs.concat(newOutputs).forEach(function (_ref) {
        var txid = _ref.txid,
            outputs = _ref.outputs;

        res[txid] = outputs;
    });
    return res;
}

function deriveBalancelessAnalysisMap(newTs, oldTs, outputs, addressToPath) {
    var res = {};
    // first, save the old ones
    oldTs.forEach(function (t) {
        res[t.hash] = t;
    });
    Object.keys(newTs).forEach(function (id) {
        res[id] = analyzeTransaction(newTs[id], outputs, addressToPath);
    });
    return res;
}

// Analyze single transaction
function analyzeTransaction(t, outputs, addressToPath) {
    var inputIds = t.tx.ins.map(function (input) {
        return { id: (0, _utils.getInputId)(input), index: input.index };
    });
    var hasJoinsplits = t.tx.joinsplits == null ? true : t.tx.joinsplits.length > 0;

    var isCoinbase = t.tx.ins.some(function (i) {
        return _bitcoinjsLibZcash.Transaction.isCoinbaseHash(i.hash);
    });

    var hash = t.hash;

    // the main logic is here
    var targets = getTargetsFromTransaction(inputIds, outputs, addressToPath, hash, hasJoinsplits);
    var dates = (0, _dates.deriveDateFormats)(t.timestamp);

    return _extends({
        isCoinbase: isCoinbase
    }, dates, {
        height: t.height,
        hash: hash
    }, targets, {
        inputs: inputIds,
        tsize: t.tx.byteLength(),
        vsize: t.vsize,
        fee: t.fee
    });
}

function getTargetsFromTransaction(inputIds, outputs, addressToPath, id, hasJoinsplits) {
    var currentOutputs = outputs[id];

    var nCredit = 0;
    var nDebit = 0;
    var value = 0;

    // testing if address is mine / change / not change / ...
    function isExternal(a) {
        return a != null && addressToPath[a] != null && addressToPath[a][0] === 0;
    }

    function isInternal(a) {
        return a != null && addressToPath[a] != null && addressToPath[a][0] === 1;
    }

    function isCredit(a) {
        return a != null && addressToPath[a] != null;
    }

    function isDebit(a) {
        return !isCredit(a);
    }

    // subtract debit impact value

    // Transaction is TAKING me my money,
    // if its input is mine
    // == if its input belongs to a transaction that's mine AND the address of corresponding output is mine
    inputIds.forEach(function (_ref2) {
        var id = _ref2.id,
            index = _ref2.index;

        var info = outputs[id];
        if (info) {
            var output = info[index];
            if (output) {
                if (isCredit(output.address)) {
                    value -= output.value;
                    nDebit++;
                }
            }
        }
    });

    var myOutputs = {};

    // add credit impact value

    // Transansction is GIVING me money,
    // if its output has address that is mine. (On any chain.)
    currentOutputs.forEach(function (output, i) {
        if (output != null) {
            if (isCredit(output.address)) {
                value += output.value;
                nCredit++;
                myOutputs[i] = { address: output.address, value: output.value, i: i };
            }
        }
    });

    var targets = [];

    function filterTargets(filterFunction) {
        var res = [];
        currentOutputs.forEach(function (info, i) {
            if (info != null) {
                var _address2 = info.address,
                    _value = info.value;

                if (filterFunction(_address2)) {
                    res.push({ address: _address2, value: _value, i: i });
                }
            }
        });
        return res;
    }

    var type = void 0;

    var insLength = inputIds.length;
    var outsLength = currentOutputs.length;

    // joinsplit is a special (zcash) case - it has no inputs - but outputs still mine

    // if all inputs are mine and all outputs are mine - no targets
    if (nDebit === insLength && !hasJoinsplits && nCredit === outsLength) {
        // within the same account
        type = 'self';
        targets = [];
    } else if (value > 0) {
        // incoming transaction, targets are either external or internal outputs
        type = 'recv';
        targets = filterTargets(function (address) {
            return isExternal(address);
        });
        if (targets.length === 0) {
            targets = filterTargets(function (address) {
                return isInternal(address);
            });
        }
    } else {
        // outgoing transaction, targets are debit outputs
        type = 'sent';
        targets = filterTargets(function (address) {
            return isDebit(address);
        });
        if (targets.length === 0) {
            // ? who knows, show self as a backup
            type = 'self';
            targets = [];
        }
    }

    // note that target selection does NOT affect value/balance
    // makes sense - even "sent to self" transactions are negative - cost fee

    return { targets: targets, type: type, value: value, myOutputs: myOutputs };
}

// Full info is just analysis sorted and with added balances
function deriveFullInfo(analysis) {
    var sortedAnalysis = (0, _utils.objectValues)(analysis).sort(compareByOldestAndType);

    var prev = null;
    var impacts = sortedAnalysis.map(function (info) {
        var balance = prev != null ? prev.balance + info.value : info.value;
        prev = _extends({}, info, {
            balance: balance
        });
        return prev;
    });
    return impacts.reverse();
}

var IMPACT_ORDERING = ['recv', 'self', 'sent'];

function compareByOldestAndType(a, b) {
    var ah = a.height != null ? a.height : Infinity;
    var bh = b.height != null ? b.height : Infinity;
    return ah - bh || 0 || // Infinity - Infinity = NaN
    IMPACT_ORDERING.indexOf(a.type) - IMPACT_ORDERING.indexOf(b.type);
}