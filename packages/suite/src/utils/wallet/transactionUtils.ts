import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';

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
            const d = new Date(item.blockTime * 1000);
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
 * Parse Date object from a string in YYYY-MM-DD format.
 *
 * @param {string} key
 */
export const parseKey = (key: string) => {
    const parts = key.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d;
};
