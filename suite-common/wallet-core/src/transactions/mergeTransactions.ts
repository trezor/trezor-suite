import { freeze } from '@reduxjs/toolkit';

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

const createTxidLookup = (storedTxs: WalletAccountTransaction[]) => {
    let firstIndexByTxid: Map<string, number> | undefined;
    let hasDuplicates = false;
    let scannedCount = 0;

    const getFirstIndexByTxid = () => {
        if (!firstIndexByTxid) {
            firstIndexByTxid = new Map();
            let indexedCount = 0;
            for (let index = storedTxs.length - 1; index >= 0; index--) {
                const tx = storedTxs[index];
                if (tx) {
                    firstIndexByTxid.set(tx.txid, index);
                    indexedCount++;
                }
            }
            hasDuplicates = firstIndexByTxid.size !== indexedCount;
        }

        return firstIndexByTxid;
    };

    const find = (txid: string) => {
        if (!firstIndexByTxid && scannedCount < storedTxs.length) {
            for (let index = 0; index < storedTxs.length; index++) {
                if (storedTxs[index]?.txid === txid) {
                    scannedCount += index + 1;

                    return index;
                }
            }
            scannedCount += storedTxs.length;

            return undefined;
        }

        return getFirstIndexByTxid().get(txid);
    };

    return { find, getFirstIndexByTxid, hasDuplicates: () => hasDuplicates };
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
            const firstIndexByTxid = lookup.getFirstIndexByTxid();
            const replacedTxid = nextTxs[index]?.txid;
            if (replacedTxid !== undefined && firstIndexByTxid.get(replacedTxid) === index) {
                const laterIndex = lookup.hasDuplicates()
                    ? nextTxs.findIndex((tx, j) => j > index && tx?.txid === replacedTxid)
                    : -1;
                if (laterIndex === -1) {
                    firstIndexByTxid.delete(replacedTxid);
                } else {
                    firstIndexByTxid.set(replacedTxid, laterIndex);
                }
            }
            firstIndexByTxid.set(transaction.txid, index);
            nextTxs[index] = freeze(transaction, true);
        } else if (shouldUpdateTransaction(existingTx, transaction)) {
            nextTxs ??= storedTxs.slice();
            nextTxs[existingTxIndex] = freeze({ ...transaction }, true);
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
            nextTxs = prependedCount === 0 || !nextTxs ? Array.from(nextTxs ?? storedTxs) : nextTxs;
            prependedCount++;
            lookup.getFirstIndexByTxid().set(transaction.txid, -prependedCount);
            nextTxs.unshift(freeze(transaction, true));
        } else if (shouldUpdateTransaction(existingTx, transaction)) {
            nextTxs ??= storedTxs.slice();
            nextTxs[existingTxIndex] = freeze({ ...transaction }, true);
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
