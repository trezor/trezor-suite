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
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d;
};

export const findTransaction = (txid: string, transactions: WalletAccountTransaction[]) =>
    transactions.find(t => t && t.txid === txid);
