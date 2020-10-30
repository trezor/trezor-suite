import { AccountTransaction } from 'trezor-connect';
import { WalletAccountTransaction } from '@wallet-types';
import { getDateWithTimeZone } from '../suite/date';
import BigNumber from 'bignumber.js';
import { toFiatCurrency } from './fiatConverterUtils';

export const sortByBlockHeight = (a: WalletAccountTransaction, b: WalletAccountTransaction) => {
    // if both are missing the blockHeight don't change their order
    const blockA = (a.blockHeight || 0) > 0 ? a.blockHeight : 0;
    const blockB = (b.blockHeight || 0) > 0 ? b.blockHeight : 0;
    if (!blockA && !blockB) return 0;
    // tx with no blockHeight comes first
    if (!blockA) return -1;
    if (!blockB) return 1;
    return blockB - blockA;
};

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
    const sortedTxs = transactions.sort((a, b) => sortByBlockHeight(a, b));
    sortedTxs.sort(sortByBlockHeight).forEach(item => {
        let key = 'pending';
        if (item.blockHeight && item.blockHeight > 0 && item.blockTime && item.blockTime > 0) {
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
            totalAmount = totalAmount.minus(tx.amount).minus(tx.fee);
        }
        if (tx.type === 'recv') {
            totalAmount = totalAmount.plus(tx.amount);
        }
    });
    return totalAmount;
};

export const sumTransactionsFiat = (
    transactions: WalletAccountTransaction[],
    fiatCurrency: string,
) => {
    let totalAmount = new BigNumber(0);
    transactions.forEach(tx => {
        // count only recv/sent txs
        if (tx.type === 'sent') {
            totalAmount = totalAmount
                .minus(toFiatCurrency(tx.amount, fiatCurrency, tx.rates, -1) ?? 0)
                .minus(toFiatCurrency(tx.fee, fiatCurrency, tx.rates, -1) ?? 0);
        }
        if (tx.type === 'recv') {
            totalAmount = totalAmount.plus(
                toFiatCurrency(tx.amount, fiatCurrency, tx.rates, -1) ?? 0,
            );
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

// inner private type, it's pointless to move it outside of this file
interface Analyze {
    newTransactions: AccountTransaction[];
    add: AccountTransaction[];
    remove: WalletAccountTransaction[];
}

const filterAnalyzeResult = (result: Analyze) => {
    // to avoid unnecessary adding/removing the same pending transactions
    // check if tx which exist in 'remove' has own replacement in 'add' (txid && blockHeight are the same)
    const preserve = result.remove.filter(tx =>
        result.add.find(a => a.txid === tx.txid && a.blockHeight === tx.blockHeight),
    );

    if (!preserve.length) return result;

    return {
        newTransactions: result.newTransactions,
        add: result.add.filter(a => !preserve.find(tx => tx.txid === a.txid)),
        remove: result.remove.filter(a => !preserve.find(tx => tx.txid === a.txid)),
    };
};

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
    const gotConfirmedTxs = known.some(tx => tx.blockHeight && tx.blockHeight > 0);
    if (!gotConfirmedTxs) {
        return filterAnalyzeResult({
            newTransactions: fresh.filter(tx => tx.blockHeight && tx.blockHeight > 0),
            add: fresh,
            remove: known,
        });
    }

    // run thru all fresh txs
    fresh.forEach((tx, i) => {
        const height = tx.blockHeight;
        const isLast = i + 1 === fresh.length;
        if (!height || height <= 0) {
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
                if (!kTx.blockHeight || kTx.blockHeight <= 0) {
                    firstKnownIndex = index + 1;
                    sliceIndex = index + 1;
                }
                // known tx is "older"
                if (kTx.blockHeight && kTx.blockHeight > 0 && kTx.blockHeight < height) {
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

    return filterAnalyzeResult({
        newTransactions: newTxs,
        add: addTxs,
        remove: known.slice(0, sliceIndex),
    });
};

export const getTxOperation = (transaction: WalletAccountTransaction) => {
    if (transaction.type === 'sent' || transaction.type === 'self') {
        return 'neg';
    }
    if (transaction.type === 'recv') {
        return 'pos';
    }
    return null;
};

export const getTargetAmount = (
    target: WalletAccountTransaction['targets'][number],
    transaction: WalletAccountTransaction,
) => {
    const isLocalTarget =
        (transaction.type === 'sent' || transaction.type === 'self') && target.isAccountTarget;
    const hasAmount = !isLocalTarget && typeof target.amount === 'string' && target.amount !== '0';
    const targetAmount =
        (hasAmount ? target.amount : null) ||
        (target === transaction.targets[0] &&
        typeof transaction.amount === 'string' &&
        transaction.amount !== '0'
            ? transaction.amount
            : null);
    return targetAmount;
};

export const isTxUnknown = (transaction: WalletAccountTransaction) => {
    // blockbook cannot parse some txs
    // eg. tx with eth smart contract that creates a new token has no valid target
    const isTokenTransaction = transaction.tokens.length > 0;
    return (
        (!isTokenTransaction && !transaction.targets.find(t => t.addresses)) ||
        transaction.type === 'unknown'
    );
};

export const isTxPending = (transaction: WalletAccountTransaction | AccountTransaction) => {
    return !transaction.blockHeight || transaction.blockHeight < 0;
};
