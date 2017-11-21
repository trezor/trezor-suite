'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.deriveUtxos = deriveUtxos;

var _utils = require('../utils');

var _bitcoinjsLibZcash = require('bitcoinjs-lib-zcash');

function deriveUtxos(newInfo, oldInfo, addressToPath, joined) {
    // First do preparations
    // Make set of all my transaction IDs, old and new
    var allTransactionHashes = deriveAllTransactionHashes(newInfo.main.newTransactions, newInfo.change.newTransactions, oldInfo.transactions);

    // Then, make set of spent outputs
    // (tx + ":" + id)
    var spentOutputs = deriveSpentOutputs(allTransactionHashes, newInfo.main.newTransactions, newInfo.change.newTransactions, oldInfo.transactions);

    // actual logic
    var utxos = _deriveUtxos(oldInfo.utxos, joined, addressToPath, spentOutputs);

    return utxos;
}

function deriveAllTransactionHashes(main, change, old) {
    var res = new Set();

    Object.keys(main).forEach(function (id) {
        res.add(id);
    });
    Object.keys(change).forEach(function (id) {
        res.add(id);
    });
    old.forEach(function (t) {
        res.add(t.hash);
    });

    return res;
}

function deriveSpentOutputs(allTransactionHashes, main, change, old) {
    var res = new Set();

    // saving only mine spent outputs
    // (to save some time)
    function canTxBeMine(id) {
        return allTransactionHashes.has(id);
    }

    function saveNew(ts) {
        (0, _utils.objectValues)(ts).forEach(function (tx) {
            tx.tx.ins.forEach(function (inp) {
                var i = inp.index;
                var id = (0, _utils.getInputId)(inp);
                if (canTxBeMine(id)) {
                    res.add(id + ':' + i);
                }
            });
        });
    }

    old.forEach(function (t) {
        t.inputs.forEach(function (_ref) {
            var id = _ref.id,
                index = _ref.index;

            if (canTxBeMine(id)) {
                res.add(id + ':' + index);
            }
        });
    });

    saveNew(main);
    saveNew(change);

    return res;
}

function _deriveUtxos(currentUtxos, newTransactions, addressToPath, spentOutputs) {
    var res = {};

    var isOwnAddress = function isOwnAddress(address) {
        return address && addressToPath[address] != null;
    };

    var isCoinbase = function isCoinbase(tx) {
        return tx.ins.some(function (i) {
            return _bitcoinjsLibZcash.Transaction.isCoinbaseHash(i.hash);
        });
    };

    // first, delete spent utxos from current batch from staying
    var filteredUtxos = currentUtxos.filter(function (utxo) {
        var ix = utxo.transactionHash + ':' + utxo.index;
        return !spentOutputs.has(ix);
    });

    // second, add them to hash, so if there is new and confirmed utxo,
    // it will overwrite existing utxo
    filteredUtxos.forEach(function (utxo) {
        var ix = utxo.transactionHash + ':' + utxo.index;
        res[ix] = utxo;
    });

    // third, find utxos in new txs and maybe overwrite existing
    var newTxs = (0, _utils.objectValues)(newTransactions);
    newTxs.forEach(function (_ref2) {
        var hash = _ref2.hash,
            tx = _ref2.tx,
            height = _ref2.height,
            outputAddresses = _ref2.outputAddresses,
            inputAddresses = _ref2.inputAddresses,
            vsize = _ref2.vsize,
            fee = _ref2.fee;

        var coinbase = isCoinbase(tx);
        var own = outputAddresses.some(function (address) {
            return isOwnAddress(address);
        });

        tx.outs.forEach(function (o, index) {
            var ix = hash + ':' + index;
            var address = outputAddresses[index];
            if (spentOutputs.has(ix) || !isOwnAddress(address)) {
                return;
            }

            var addressPath = addressToPath[address];
            var resIx = {
                index: index,
                value: o.value,
                transactionHash: hash,
                height: height,
                coinbase: coinbase,
                addressPath: addressPath,
                vsize: vsize,
                tsize: tx.byteLength(),
                fee: fee,
                own: own
            };
            res[ix] = resIx;
        });
    });

    return (0, _utils.objectValues)(res);
}