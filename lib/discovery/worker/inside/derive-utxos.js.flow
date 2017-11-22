/* @flow */

import type {
    ChainNewTransactions,
    AddressToPath,
    AccountNewInfo,
} from '../types';
import type {
    TransactionInfo,
    AccountInfo,
    UtxoInfo,
} from '../../index';

import {
    objectValues,
    getInputId,
} from '../utils';

import type { Input as BitcoinJsInput } from 'bitcoinjs-lib-zcash';
import {
    Transaction as BitcoinJsTransaction,
} from 'bitcoinjs-lib-zcash';

export function deriveUtxos(
    newInfo: AccountNewInfo,
    oldInfo: AccountInfo,
    addressToPath: AddressToPath,
    joined: ChainNewTransactions
) {
    // First do preparations
    // Make set of all my transaction IDs, old and new
    const allTransactionHashes = deriveAllTransactionHashes(
        newInfo.main.newTransactions,
        newInfo.change.newTransactions,
        oldInfo.transactions
    );

    // Then, make set of spent outputs
    // (tx + ":" + id)
    const spentOutputs = deriveSpentOutputs(
        allTransactionHashes,
        newInfo.main.newTransactions,
        newInfo.change.newTransactions,
        oldInfo.transactions
    );

    // actual logic
    const utxos = _deriveUtxos(
        oldInfo.utxos,
        joined,
        addressToPath,
        spentOutputs
    );

    return utxos;
}

function deriveAllTransactionHashes(
    main: ChainNewTransactions,
    change: ChainNewTransactions,
    old: Array<TransactionInfo>
): Set<string> {
    const res = new Set();

    Object.keys(main).forEach(id => {
        res.add(id);
    });
    Object.keys(change).forEach(id => {
        res.add(id);
    });
    old.forEach(t => {
        res.add(t.hash);
    });

    return res;
}

function deriveSpentOutputs(
    allTransactionHashes: Set<string>,
    main: ChainNewTransactions,
    change: ChainNewTransactions,
    old: Array<TransactionInfo>
): Set<string> {
    const res = new Set();

    // saving only mine spent outputs
    // (to save some time)
    function canTxBeMine(id: string): boolean {
        return allTransactionHashes.has(id);
    }

    function saveNew(ts: ChainNewTransactions) {
        objectValues(ts).forEach(tx => {
            tx.tx.ins.forEach((inp: BitcoinJsInput) => {
                const i = inp.index;
                const id = getInputId(inp);
                if (canTxBeMine(id)) {
                    res.add(id + ':' + i);
                }
            });
        });
    }

    old.forEach(t => {
        t.inputs.forEach(({id, index}) => {
            if (canTxBeMine(id)) {
                res.add(id + ':' + index);
            }
        });
    });

    saveNew(main);
    saveNew(change);

    return res;
}

function _deriveUtxos(
    currentUtxos: Array<UtxoInfo>,
    newTransactions: ChainNewTransactions,
    addressToPath: AddressToPath,
    spentOutputs: Set<string>
): Array<UtxoInfo> {
    const res: {[i: string]: UtxoInfo} = {};

    const isOwnAddress = (address) => {
        return address &&
            addressToPath[address] != null;
    };

    const isCoinbase = (tx) => {
        return tx.ins.some((i) => BitcoinJsTransaction.isCoinbaseHash(i.hash));
    };

    // first, delete spent utxos from current batch from staying
    const filteredUtxos = currentUtxos.filter(utxo => {
        const ix = utxo.transactionHash + ':' + utxo.index;
        return !(spentOutputs.has(ix));
    });

    // second, add them to hash, so if there is new and confirmed utxo,
    // it will overwrite existing utxo
    filteredUtxos.forEach(utxo => {
        const ix = utxo.transactionHash + ':' + utxo.index;
        res[ix] = utxo;
    });

    // third, find utxos in new txs and maybe overwrite existing
    const newTxs = objectValues(newTransactions);
    newTxs.forEach(({hash, tx, height, outputAddresses, inputAddresses, vsize, fee}) => {
        const coinbase = isCoinbase(tx);
        const own = outputAddresses.some(address => isOwnAddress(address));

        tx.outs.forEach((o, index) => {
            const ix = hash + ':' + index;
            const address = outputAddresses[index];
            if ((spentOutputs.has(ix)) || !isOwnAddress(address)) {
                return;
            }

            const addressPath = addressToPath[address];
            const resIx: UtxoInfo = {
                index: index,
                value: o.value,
                transactionHash: hash,
                height: height,
                coinbase: coinbase,
                addressPath,
                vsize,
                tsize: tx.byteLength(),
                fee,
                own,
            };
            res[ix] = resIx;
        });
    });

    return objectValues(res);
}
