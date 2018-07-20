/* @flow */

import type {
    AccountInfo,
    TransactionInfo,
    AddressWithReceived,
    UtxoInfo,
    TargetInfo,
} from '../../index';

import type {
    AccountNewInfo,
    Block,
    AddressToPath,
    ChainNewTransactions,
} from '../types';

import {
    deriveUtxos,
} from './derive-utxos';

import {
    deriveAnalysis,
} from './derive-analysis';

import {
    objectValues,
} from '../utils';

// When utxo transaction disappear, so does the utxo
// However, if it was transaction from us, it also means
// utxo has to be added (if it is a tx that came from us)
//
// If the utxo that needs to be added is in the new info
// - as is in the case when it is a chain of unconf txs -
// it will be readded again in derive-utxos
//
// However, if it is an old tx, it needs to be added here
// because derive-utxos does not go through old txs
function deleteTxs(
    oldInfo: AccountInfo,
    txs: Array<string>,
    atp: AddressToPath,
): AccountInfo {
    const set: Set<string> = new Set(txs);
    const filteredUtxos = oldInfo.utxos.filter(utxo => !set.has(utxo.transactionHash));
    const deletedTransactions = oldInfo.transactions.filter(tx => set.has(tx.hash));
    const filteredTransactions = oldInfo.transactions.filter(tx => !set.has(tx.hash));

    const addedUtxos: Array<UtxoInfo> = [];
    deletedTransactions.map(deletedTran => {
        // this is not efficient At ALL,
        // but it does not happen frequently
        // (usually not at all)
        // => no need to optimize here, just go naively
        deletedTran.inputs.forEach(deletedInp => {
            const deletedInpHash = deletedInp.id;
            const deletedInpI = deletedInp.index;
            filteredTransactions.forEach(transaction => {
                const thash = transaction.hash;
                if (thash === deletedInpHash) {
                    const o = transaction.myOutputs[deletedInpI];
                    if (o != null) {
                        // ALSO needs to find, if any of the inputs
                        // are also mine
                        let own = false;
                        filteredTransactions.forEach(ptran => {
                            transaction.inputs.forEach(ip => {
                                if (
                                    ip.id === ptran.hash &&
                                    ptran.myOutputs[ip.index] != null
                                ) {
                                    own = true;
                                }
                            });
                        });
                        addedUtxos.push(utxoFromTarget(
                            o,
                            transaction,
                            atp,
                            own
                        ));
                    }
                }
            });
        });
    });

    return {
        ...oldInfo,
        utxos: filteredUtxos.concat(addedUtxos),
        transactions: filteredTransactions,
    };
}

function utxoFromTarget(
    t: TargetInfo,
    tx: TransactionInfo,
    atp: AddressToPath,
    own: boolean
): UtxoInfo {
    const resIx: UtxoInfo = {
        index: t.i,
        value: t.value,
        transactionHash: tx.hash,
        height: tx.height,
        coinbase: tx.isCoinbase,
        addressPath: atp[t.address],
        vsize: tx.vsize,
        tsize: tx.tsize,
        own,
    };
    return resIx;
}

export function integrateNewTxs(
    newInfo: AccountNewInfo,
    oldInfoUndeleted: AccountInfo,
    lastBlock: Block,
    deletedTxs: Array<string>,
    gap: number,
    wantedOffset: number, // what (new Date().getTimezoneOffset()) returns
): AccountInfo {
    const addressToPath = deriveAddressToPath(
        newInfo.main.allAddresses,
        newInfo.change.allAddresses
    );

    const oldInfo = (deletedTxs.length !== 0)
        ? deleteTxs(oldInfoUndeleted, deletedTxs, addressToPath)
        : oldInfoUndeleted;

    const joined = deriveJoined(
        newInfo.main.newTransactions,
        newInfo.change.newTransactions
    );

    const utxos = deriveUtxos(
        newInfo,
        oldInfo,
        addressToPath,
        joined
    );

    const transactions = deriveAnalysis(
        joined,
        oldInfo.transactions,
        addressToPath,
        lastBlock,
        wantedOffset
    );

    const {usedAddresses, unusedAddresses, lastConfirmed: lastConfirmedMain} = deriveUsedAddresses(
        transactions,
        addressToPath,
        newInfo.main.allAddresses,
        0,
        gap
    );

    const usedChange = deriveUsedAddresses(
        transactions,
        addressToPath,
        newInfo.change.allAddresses,
        1,
        gap
    );

    const balance = transactions.length > 0 ? transactions[0].balance : 0;
    const utxoBalance: number = utxos.reduce((prev, a) => a.value + prev, 0);
    if (balance !== utxoBalance) {
        throw new Error('Inconsistent info.');
    }

    const sentAddresses = deriveSentAddresses(transactions);

    const changeAddresses = newInfo.change.allAddresses;
    const changeIndex = usedChange.usedAddresses.length;
    const allowChange = usedChange.unusedAddresses.length > 0;
    const lastConfirmedChange = usedChange.lastConfirmed;

    const state = {
        utxos,
        transactions,
        usedAddresses,
        unusedAddresses,
        lastConfirmedMain,
        lastConfirmedChange,
        changeIndex,
        balance,
        lastBlock,
        sentAddresses,
        changeAddresses,
        allowChange,
        version: oldInfoUndeleted.version,
    };
    return state;
}

function deriveAddressToPath(
    main: Array<string>,
    change: Array<string>
): AddressToPath {
    const res: AddressToPath = {};

    main.forEach((a, i) => {
        res[a] = [0, i];
    });
    change.forEach((a, i) => {
        res[a] = [1, i];
    });

    return res;
}

function deriveJoined(
    main: ChainNewTransactions,
    change: ChainNewTransactions
): ChainNewTransactions {
    const res = {};

    Object.keys(main).forEach(id => {
        res[id] = main[id];
    });
    Object.keys(change).forEach(id => {
        res[id] = change[id];
    });

    return res;
}

function deriveSentAddresses(
    transactions: Array<TransactionInfo>
): {[txPlusIndex: string]: string} {
    const res = {};
    transactions.forEach(t => {
        if (t.type === 'sent') {
            t.targets.forEach(({address, i}) => {
                const txId = t.hash;
                const key = txId + ':' + i;
                res[key] = address;
            });
        }
    });
    return res;
}

function deriveUsedAddresses(
    transactions: Array<TransactionInfo>,
    addressToPath: AddressToPath,
    allAddresses: Array<string>,
    chain: number,
    gap: number
): {
    usedAddresses: Array<AddressWithReceived>,
    unusedAddresses: Array<string>,
    lastConfirmed: number,
} {
    const allReceived: Array<number> = [];
    let lastUsed = -1;
    let lastConfirmed = -1;

    transactions.forEach(t => {
        objectValues(t.myOutputs).forEach(o => {
            const address = o.address;
            const value = o.value;
            const path = addressToPath[address];
            if (path[0] === chain) {
                const id = path[1];
                if (allReceived[id] == null) {
                    allReceived[id] = value;
                } else {
                    allReceived[id] += value;
                }
                if (lastUsed < id) {
                    lastUsed = id;
                }
                if (t.height != null) {
                    if (lastConfirmed < id) {
                        lastConfirmed = id;
                    }
                }
            }
        });
    });

    const usedAddresses = [];
    for (let i = 0; i <= lastUsed; i++) {
        const address = allAddresses[i];
        const received = allReceived[i] == null ? 0 : allReceived[i];
        usedAddresses.push({address, received});
    }
    const unusedAddresses = [];
    for (let i = lastUsed + 1; i <= lastConfirmed + gap; i++) {
        unusedAddresses.push(allAddresses[i]);
    }
    return {usedAddresses, unusedAddresses, lastConfirmed};
}

