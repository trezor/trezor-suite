import type { WalletAccountTransaction } from '@suite-common/wallet-types';

const shouldUpdateTransaction = (
    existingTx: WalletAccountTransaction,
    transaction: WalletAccountTransaction,
) => {
    const existingBlockHeight = existingTx.blockHeight ?? 0;
    const incomingBlockHeight = transaction.blockHeight ?? 0;
    const existingIsPending = existingBlockHeight <= 0;
    const incomingIsPending = incomingBlockHeight <= 0;

    return (
        (existingIsPending && !incomingIsPending) ||
        (existingIsPending === incomingIsPending && existingBlockHeight < incomingBlockHeight) ||
        (existingIsPending === incomingIsPending &&
            (existingTx.blockTime ?? 0) < (transaction.blockTime ?? 0)) ||
        (existingIsPending && !existingTx.rbfParams && transaction.rbfParams) ||
        (existingTx.deadline && !transaction.deadline)
    );
};

type TxidIndex = {
    firstIndexByTxid: Map<string, number>;
    hasDuplicates: boolean;
};

type TxidLookup = {
    find: (txid: string) => number | undefined;
    getFirstIndexByTxid: () => TxidIndex;
};

const createTxidLookup = (storedTxs: WalletAccountTransaction[]): TxidLookup => {
    let txidIndex: TxidIndex | undefined;
    let scannedCount = 0;

    const getFirstIndexByTxid = () => {
        if (!txidIndex) {
            txidIndex = { firstIndexByTxid: new Map(), hasDuplicates: false };
            for (let index = 0; index < storedTxs.length; index++) {
                const tx = storedTxs[index];
                if (!tx) {
                    continue;
                }
                if (txidIndex.firstIndexByTxid.has(tx.txid)) {
                    txidIndex.hasDuplicates = true;
                } else {
                    txidIndex.firstIndexByTxid.set(tx.txid, index);
                }
            }
        }

        return txidIndex;
    };

    const find = (txid: string) => {
        if (!txidIndex && scannedCount < storedTxs.length) {
            for (let index = 0; index < storedTxs.length; index++) {
                if (storedTxs[index]?.txid === txid) {
                    scannedCount += index + 1;

                    return index;
                }
            }
            scannedCount += storedTxs.length;

            return undefined;
        }

        return getFirstIndexByTxid().firstIndexByTxid.get(txid);
    };

    return { find, getFirstIndexByTxid };
};

const writePage = (
    storedTxs: WalletAccountTransaction[],
    transactions: WalletAccountTransaction[],
    pageStart: number,
) => {
    const lookup = createTxidLookup(storedTxs);
    let nextTxs: WalletAccountTransaction[] | undefined;

    transactions.forEach((transaction, i) => {
        const existingTxIndex = lookup.find(transaction.txid) ?? -1;
        const existingTx = (nextTxs ?? storedTxs)[existingTxIndex];
        if (!existingTx) {
            const index = pageStart + i;
            nextTxs ??= storedTxs.slice();
            const { firstIndexByTxid, hasDuplicates } = lookup.getFirstIndexByTxid();
            const replacedTxid = nextTxs[index]?.txid;
            if (replacedTxid !== undefined && firstIndexByTxid.get(replacedTxid) === index) {
                const laterIndex = hasDuplicates
                    ? nextTxs.findIndex((tx, j) => j > index && tx?.txid === replacedTxid)
                    : -1;
                if (laterIndex === -1) {
                    firstIndexByTxid.delete(replacedTxid);
                } else {
                    firstIndexByTxid.set(replacedTxid, laterIndex);
                }
            }
            firstIndexByTxid.set(transaction.txid, index);
            nextTxs[index] = transaction;
        } else if (shouldUpdateTransaction(existingTx, transaction)) {
            nextTxs ??= storedTxs.slice();
            nextTxs[existingTxIndex] = { ...transaction };
        }
    });

    return nextTxs;
};

const prependTransactions = (
    storedTxs: WalletAccountTransaction[],
    transactions: WalletAccountTransaction[],
) => {
    const lookup = createTxidLookup(storedTxs);
    let nextTxs: WalletAccountTransaction[] | undefined;
    let prependedCount = 0;

    transactions.forEach(transaction => {
        const storedIndex = lookup.find(transaction.txid);
        const existingTxIndex = storedIndex === undefined ? -1 : storedIndex + prependedCount;
        const existingTx = (nextTxs ?? storedTxs)[existingTxIndex];
        if (!existingTx) {
            if (!nextTxs || prependedCount === 0) {
                nextTxs = Array.from(nextTxs ?? storedTxs);
            }
            prependedCount++;
            lookup.getFirstIndexByTxid().firstIndexByTxid.set(transaction.txid, -prependedCount);
            nextTxs.unshift(transaction);
        } else if (shouldUpdateTransaction(existingTx, transaction)) {
            nextTxs ??= storedTxs.slice();
            nextTxs[existingTxIndex] = { ...transaction };
        }
    });

    return nextTxs;
};

type MergeTransactionsParams = {
    storedTxs: WalletAccountTransaction[];
    transactions: WalletAccountTransaction[];
    page?: number;
    perPage?: number;
};

export const mergeTransactions = ({
    storedTxs,
    transactions,
    page,
    perPage,
}: MergeTransactionsParams) =>
    page && perPage
        ? writePage(storedTxs, transactions, (page - 1) * perPage)
        : prependTransactions(storedTxs, transactions);
