import { AccountTransaction } from 'trezor-connect';
import { WalletAccountTransaction } from '@wallet-types';
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
            const t = item.blockTime * 1000;
            const d = getDateWithTimeZone(t);
            if (d) {
                // YYYY-MM-DD format
                key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            } else {
                console.log(
                    `Error during grouping transaction by date. Failed timestamp conversion (${t})`,
                );
            }
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
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
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

    // No fresh info
    // remove all known
    if (fresh.length < 1) {
        return {
            newTransactions: [],
            add: [],
            remove: known,
        };
    }

    // If there are no known confirmed txs
    // remove all known and add all fresh
    const gotConfirmedTxs = known.some(tx => tx.blockHeight);
    if (!gotConfirmedTxs) {
        return {
            newTransactions: fresh.filter(tx => tx.blockHeight),
            add: fresh,
            remove: known,
        };
    }

    // run thru all fresh txs
    fresh.forEach((tx, i) => {
        const height = tx.blockHeight;
        const isLast = i + 1 === fresh.length;
        if (!height) {
            // add pending tx
            addTxs.push(tx);
        } else {
            let index = firstKnownIndex;
            const len = known.length;
            // use simple for loop to have possibility to `break`
            for (index; index < len; index++) {
                const kTx = known[index];
                // known tx is pending, it will be removed
                // move sliceIndex, set firstKnownIndex
                if (!kTx.blockHeight) {
                    firstKnownIndex = index + 1;
                    sliceIndex = index + 1;
                }
                // known tx is "older"
                if (kTx.blockHeight && kTx.blockHeight < height) {
                    // set sliceIndex
                    sliceIndex = isLast ? len : index;
                    // all fresh txs to this point needs to be added
                    addTxs = fresh.slice(0, i + 1);
                    // this fresh tx is brand new
                    newTxs.push(tx);
                    break;
                }
                // known tx is on the same height
                if (kTx.blockHeight === height) {
                    firstKnownIndex = index + 1;
                    // known tx changed (rollback)
                    if (kTx.blockHash !== tx.blockHash) {
                        // set sliceIndex
                        sliceIndex = isLast ? len : index + 1;
                        // this fresh tx is not new but needs to be added (replace kTx)
                        addTxs.push(tx);
                    }
                    break;
                }
            }
        }
    });
    return {
        newTransactions: newTxs,
        add: addTxs,
        remove: known.slice(0, sliceIndex),
    };
};
