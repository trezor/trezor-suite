/* @flow */

import type {
    AccountInfo,
    TransactionInfo,
    AddressWithReceived,
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

const GAP_SIZE: number = 20;

function deleteTxs(
    oldInfo: AccountInfo,
    txs: Array<string>
): AccountInfo {
    const set: Set<string> = new Set(txs);
    const utxos = oldInfo.utxos.filter(utxo => !set.has(utxo.transactionHash));
    const transactions = oldInfo.transactions.filter(tx => !set.has(tx.hash));
    return {
        ...oldInfo,
        utxos,
        transactions,
    };
}

export function integrateNewTxs(
    newInfo: AccountNewInfo,
    oldInfoUndeleted: AccountInfo,
    lastBlock: Block,
    deletedTxs: Array<string>
): AccountInfo {
    const oldInfo = (deletedTxs.length !== 0)
        ? deleteTxs(oldInfoUndeleted, deletedTxs)
        : oldInfoUndeleted;
    const addressToPath = deriveAddressToPath(
        newInfo.main.allAddresses,
        newInfo.change.allAddresses
    );

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
        addressToPath
    );

    const {usedAddresses, unusedAddresses, lastConfirmed: lastConfirmedMain} = deriveUsedAddresses(
        transactions,
        addressToPath,
        newInfo.main.allAddresses,
        0
    );

    const usedChange = deriveUsedAddresses(
        transactions,
        addressToPath,
        newInfo.change.allAddresses,
        1
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
    chain: number
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
                if (t.height) {
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
    for (let i = lastUsed + 1; i <= lastConfirmed + GAP_SIZE; i++) {
        unusedAddresses.push(allAddresses[i]);
    }
    return {usedAddresses, unusedAddresses, lastConfirmed};
}

