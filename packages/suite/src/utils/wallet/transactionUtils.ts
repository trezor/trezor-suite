import { AccountTransaction } from 'trezor-connect';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { getDateWithTimeZone } from '../suite/date';
import BigNumber from 'bignumber.js';

/**
 * Returns object with transactions grouped by a date. Key is a string in YYYY-MM-DD format.
 * Pending txs are assigned to key 'pending'.
 *
 * @param {WalletAccountTransaction[]} transactions
 */
export const groupTransactionsByDate = (
    transactions: WalletAccountTransaction[],
): { [key: string]: WalletAccountTransaction[] } => {
    const r: { [key: string]: WalletAccountTransaction[] } = {};
    transactions.forEach(item => {
        let key = 'pending';
        if (item.blockHeight && item.blockTime && item.blockTime !== 0) {
            const d = getDateWithTimeZone(item.blockTime * 1000);
            // YYYY-MM-DD format
            key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        }
        if (!r[key]) {
            r[key] = [];
        }
        r[key].push(item);
    });
    return r;
};

/**
 * Returns a sum of sent/recv txs amounts as a BigNumber.
 * Amounts of sent transactions are added, amounts of recv transactions are subtracted
 *
 * @param {WalletAccountTransaction[]} transactions
 */
export const sumTransactions = (transactions: WalletAccountTransaction[]) => {
    let totalAmount = new BigNumber(0);
    transactions.forEach(tx => {
        // count only recv/sent txs
        if (tx.type === 'sent') {
            totalAmount = totalAmount.minus(tx.amount);
        }
        if (tx.type === 'recv') {
            totalAmount = totalAmount.plus(tx.amount);
        }
    });
    return totalAmount;
};

/**
 * Parse Date object from a string in YYYY-MM-DD format.
 *
 * @param {string} key
 */
export const parseKey = (key: string) => {
    const parts = key.split('-');
    const d = getDateWithTimeZone(
        new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime(),
    );
    return d;
};

export const findTransaction = (txid: string, transactions: WalletAccountTransaction[]) =>
    transactions.find(t => t && t.txid === txid);

export const analyzeTransactions = (
    fresh: AccountTransaction[],
    known: WalletAccountTransaction[],
) => {
    let addTxs: AccountTransaction[] = [];
    const newTxs: AccountTransaction[] = [];
    let firstKnownIndex = 0;
    let sliceIndex = 0;

    if (fresh.length < 1) {
        return {
            newTransactions: [],
            add: [],
            remove: known,
        };
    }

    // If there are no known confirmed txs
    // just remove all known and add all fresh
    const gotConfirmedTxs = known.some(tx => tx.blockHeight);
    if (!gotConfirmedTxs) {
        return {
            newTransactions: fresh.filter(tx => tx.blockHeight),
            add: fresh,
            remove: known,
        };
    }

    fresh.forEach((tx, i) => {
        const height = tx.blockHeight;
        const isLast = i + 1 === fresh.length;
        if (!height) {
            addTxs.push(tx);
        } else {
            let index = firstKnownIndex;
            const len = known.length;
            for (index; index < len; index++) {
                const kTx = known[index];
                if (!kTx.blockHeight) {
                    firstKnownIndex = index + 1;
                    sliceIndex = index + 1;
                }
                if (kTx.blockHeight && kTx.blockHeight < height) {
                    sliceIndex = isLast ? len : index;
                    // console.warn("-lower", kTx, tx, isLast)
                    addTxs = fresh.slice(0, i + 1);
                    newTxs.push(tx);
                    break;
                }
                if (kTx.blockHeight === height) {
                    firstKnownIndex = index + 1;
                    // console.warn("-equal", kTx, tx)
                    if (kTx.blockHash !== tx.blockHash) {
                        sliceIndex = isLast ? len : index + 1;
                        // console.warn("+++setslice", index, isLast);
                        addTxs.push(tx);
                    }
                    break;
                }
                // console.warn("-default", kTx, tx)
            }
            // if (changed > 0 && validIndex < index - changed) validIndex = index - changed;
            // if (validIndex < lastValidIndex - changed) validIndex = lastValidIndex - changed;
            // if (validIndex < index - changed) validIndex = index - changed;
            // console.log("Final index", index firstKnownIndex, sliceIndex);
        }
    });
    return {
        newTransactions: newTxs,
        add: addTxs,
        remove: known.slice(0, sliceIndex),
    };
};
