import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { getNativeWrapTxKind } from './ethUtils';
import { isPending } from './transactionUtils';

export type WrappedNativePendingTxStatus = 'pending' | 'confirmed' | 'failed';

export type TrackedWrappedNativeTransaction = {
    transaction: WalletAccountTransaction;
    isReplacement: boolean;
};

type FindTrackedWrappedNativeTransactionParams = {
    transactions: WalletAccountTransaction[];
    txid: string;
    nonce?: number;
};

export const findTrackedWrappedNativeTransaction = ({
    transactions,
    txid,
    nonce,
}: FindTrackedWrappedNativeTransactionParams): TrackedWrappedNativeTransaction | undefined => {
    const originalTransaction = transactions.find(transaction => transaction.txid === txid);

    if (originalTransaction) {
        return { transaction: originalTransaction, isReplacement: false };
    }

    if (nonce === undefined) {
        return undefined;
    }

    const replacementTransaction = transactions.find(
        transaction => transaction.ethereumSpecific?.nonce === nonce,
    );

    return replacementTransaction
        ? { transaction: replacementTransaction, isReplacement: true }
        : undefined;
};

type GetWrappedNativePendingTxStatusParams = {
    txid: string | null;
    trackedTransaction?: TrackedWrappedNativeTransaction;
    flowType: 'wrap' | 'unwrap';
};

export const getWrappedNativePendingTxStatus = ({
    txid,
    trackedTransaction,
    flowType,
}: GetWrappedNativePendingTxStatusParams): WrappedNativePendingTxStatus | null => {
    if (!txid) {
        return null;
    }

    if (!trackedTransaction || isPending(trackedTransaction.transaction)) {
        return 'pending';
    }

    if (
        trackedTransaction.transaction.type === 'failed' ||
        (trackedTransaction.isReplacement &&
            getNativeWrapTxKind(trackedTransaction.transaction) !== flowType)
    ) {
        return 'failed';
    }

    return 'confirmed';
};
