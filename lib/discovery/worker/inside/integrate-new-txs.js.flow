'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.integrateNewTxs = integrateNewTxs;

var _deriveUtxos = require('./derive-utxos');

var _deriveAnalysis = require('./derive-analysis');

var _utils = require('../utils');

var GAP_SIZE = 20;

function deleteTxs(oldInfo, txs) {
    var set = new Set(txs);
    var utxos = oldInfo.utxos.filter(function (utxo) {
        return !set.has(utxo.transactionHash);
    });
    var transactions = oldInfo.transactions.filter(function (tx) {
        return !set.has(tx.hash);
    });
    return _extends({}, oldInfo, {
        utxos: utxos,
        transactions: transactions
    });
}

function integrateNewTxs(newInfo, oldInfoUndeleted, lastBlock, deletedTxs) {
    var oldInfo = deletedTxs.length !== 0 ? deleteTxs(oldInfoUndeleted, deletedTxs) : oldInfoUndeleted;
    var addressToPath = deriveAddressToPath(newInfo.main.allAddresses, newInfo.change.allAddresses);

    var joined = deriveJoined(newInfo.main.newTransactions, newInfo.change.newTransactions);

    var utxos = (0, _deriveUtxos.deriveUtxos)(newInfo, oldInfo, addressToPath, joined);

    var transactions = (0, _deriveAnalysis.deriveAnalysis)(joined, oldInfo.transactions, addressToPath);

    var _deriveUsedAddresses = deriveUsedAddresses(transactions, addressToPath, newInfo.main.allAddresses, 0),
        usedAddresses = _deriveUsedAddresses.usedAddresses,
        unusedAddresses = _deriveUsedAddresses.unusedAddresses,
        lastConfirmedMain = _deriveUsedAddresses.lastConfirmed;

    var usedChange = deriveUsedAddresses(transactions, addressToPath, newInfo.change.allAddresses, 1);

    var balance = transactions.length > 0 ? transactions[0].balance : 0;
    var utxoBalance = utxos.reduce(function (prev, a) {
        return a.value + prev;
    }, 0);
    if (balance !== utxoBalance) {
        throw new Error('Inconsistent info.');
    }

    var sentAddresses = deriveSentAddresses(transactions);

    var changeAddresses = newInfo.change.allAddresses;
    var changeIndex = usedChange.usedAddresses.length;
    var allowChange = usedChange.unusedAddresses.length > 0;
    var lastConfirmedChange = usedChange.lastConfirmed;

    var state = {
        utxos: utxos,
        transactions: transactions,
        usedAddresses: usedAddresses,
        unusedAddresses: unusedAddresses,
        lastConfirmedMain: lastConfirmedMain,
        lastConfirmedChange: lastConfirmedChange,
        changeIndex: changeIndex,
        balance: balance,
        lastBlock: lastBlock,
        sentAddresses: sentAddresses,
        changeAddresses: changeAddresses,
        allowChange: allowChange,
        version: oldInfoUndeleted.version
    };
    return state;
}

function deriveAddressToPath(main, change) {
    var res = {};

    main.forEach(function (a, i) {
        res[a] = [0, i];
    });
    change.forEach(function (a, i) {
        res[a] = [1, i];
    });

    return res;
}

function deriveJoined(main, change) {
    var res = {};

    Object.keys(main).forEach(function (id) {
        res[id] = main[id];
    });
    Object.keys(change).forEach(function (id) {
        res[id] = change[id];
    });

    return res;
}

function deriveSentAddresses(transactions) {
    var res = {};
    transactions.forEach(function (t) {
        if (t.type === 'sent') {
            t.targets.forEach(function (_ref) {
                var address = _ref.address,
                    i = _ref.i;

                var txId = t.hash;
                var key = txId + ':' + i;
                res[key] = address;
            });
        }
    });
    return res;
}

function deriveUsedAddresses(transactions, addressToPath, allAddresses, chain) {
    var allReceived = [];
    var lastUsed = -1;
    var lastConfirmed = -1;

    transactions.forEach(function (t) {
        (0, _utils.objectValues)(t.myOutputs).forEach(function (o) {
            var address = o.address;
            var value = o.value;
            var path = addressToPath[address];
            if (path[0] === chain) {
                var id = path[1];
                if (allReceived[id] == null) {
                    allReceived[id] = value;
                } else {
                    allReceived[id] += value;
                }
                if (lastUsed < id) {
                    lastUsed = id;
                }
                if (t.height) {
                    if (lastConfirmed < id) {
                        lastConfirmed = id;
                    }
                }
            }
        });
    });

    var usedAddresses = [];
    for (var i = 0; i <= lastUsed; i++) {
        var address = allAddresses[i];
        var received = allReceived[i] == null ? 0 : allReceived[i];
        usedAddresses.push({ address: address, received: received });
    }
    var unusedAddresses = [];
    for (var _i = lastUsed + 1; _i <= lastConfirmed + GAP_SIZE; _i++) {
        unusedAddresses.push(allAddresses[_i]);
    }
    return { usedAddresses: usedAddresses, unusedAddresses: unusedAddresses, lastConfirmed: lastConfirmed };
}