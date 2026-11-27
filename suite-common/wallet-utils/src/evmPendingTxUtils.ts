import {
    type EvmTransactionPurpose,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';

import { getEvmTransactionPurpose, getWrappedNativeTxTarget } from './ethUtils';
import { isPending, isSignedByAccount } from './transactionUtils';

export type EvmPendingTxStatus = 'pending' | 'confirmed' | 'failed';

export interface TrackedEvmTransaction {
    transaction: WalletAccountTransaction;
    isReplacement: boolean;
}

export type EvmTransactionCall = {
    to: string;
    data: string;
    /** Native value in decimal base units. */
    value: string;
};

const matchesEvmTransactionCall = (
    transaction: WalletAccountTransaction,
    expectedCall: EvmTransactionCall,
): boolean => {
    // Display targets can omit zero-value outputs or include internal transfers. The first
    // raw output is the top-level EVM call, including its native value.
    const output = transaction.details.vout[0];

    return (
        output?.value === expectedCall.value &&
        output.addresses?.[0]?.toLowerCase() === expectedCall.to.toLowerCase() &&
        transaction.ethereumSpecific?.data?.toLowerCase() === expectedCall.data.toLowerCase()
    );
};

interface FindTrackedEvmTransactionParams {
    transactions: WalletAccountTransaction[];
    txid: string;
    nonce?: number;
    expectedCall?: EvmTransactionCall;
}

export const findTrackedEvmTransaction = ({
    transactions,
    txid,
    nonce,
    expectedCall,
}: FindTrackedEvmTransactionParams): TrackedEvmTransaction | undefined => {
    const original = transactions.find(transaction => transaction.txid === txid);
    const originalMatch = original ? { transaction: original, isReplacement: false } : undefined;

    if (original && (!expectedCall || !isPending(original))) {
        return originalMatch;
    }

    const trackedNonce = original?.ethereumSpecific?.nonce ?? nonce;

    if (trackedNonce === undefined) {
        return originalMatch;
    }

    // The account's own signed transactions share its nonce counter. In particular, a reverted
    // incoming transaction can be labelled 'failed' and still carry the other signer's nonce.
    let pendingReplacement: TrackedEvmTransaction | undefined;
    for (const transaction of transactions) {
        if (
            transaction.txid === txid ||
            transaction.ethereumSpecific?.nonce !== trackedNonce ||
            !isSignedByAccount(transaction)
        ) {
            continue;
        }

        const replacement = { transaction, isReplacement: true };

        // A mined replacement consumed the nonce, even if stale pending entries remain.
        if (!expectedCall || !isPending(transaction)) {
            return replacement;
        }

        if (!pendingReplacement && matchesEvmTransactionCall(transaction, expectedCall)) {
            pendingReplacement = replacement;
        }
    }

    return pendingReplacement ?? originalMatch;
};

export const getConfirmedEvmTransactionPurpose = (
    transaction: WalletAccountTransaction,
): EvmTransactionPurpose =>
    getEvmTransactionPurpose({
        networkSymbol: transaction.symbol,
        to: getWrappedNativeTxTarget(transaction),
        data: transaction.ethereumSpecific?.data,
    });

type GetTrackedWrappedNativeTxidParams = {
    txid: string | null;
    trackedTransaction?: TrackedEvmTransaction;
    expectedCall?: EvmTransactionCall;
};

export const getTrackedWrappedNativeTxid = ({
    txid,
    trackedTransaction,
    expectedCall,
}: GetTrackedWrappedNativeTxidParams): string | null =>
    trackedTransaction?.isReplacement &&
    expectedCall &&
    matchesEvmTransactionCall(trackedTransaction.transaction, expectedCall)
        ? trackedTransaction.transaction.txid
        : txid;

type GetEvmPendingTxStatusParams = GetTrackedWrappedNativeTxidParams & {
    expectedPurpose: EvmTransactionPurpose;
};

export const getEvmPendingTxStatus = ({
    txid,
    trackedTransaction,
    expectedPurpose,
    expectedCall,
}: GetEvmPendingTxStatusParams): EvmPendingTxStatus | null => {
    if (!txid) return null;

    if (!trackedTransaction || isPending(trackedTransaction.transaction)) {
        return 'pending';
    }

    // Only a replacement needs checking: a transaction confirmed under the tracked txid can only
    // carry the calldata that was signed, while a replacement is a different transaction that
    // merely reuses the nonce.
    const { transaction, isReplacement } = trackedTransaction;
    const isWrappedNative = expectedPurpose === 'wrap' || expectedPurpose === 'unwrap';
    const didOperationChange =
        isReplacement &&
        (isWrappedNative
            ? !expectedCall || !matchesEvmTransactionCall(transaction, expectedCall)
            : getConfirmedEvmTransactionPurpose(transaction) !== expectedPurpose);

    if (transaction.type === 'failed' || didOperationChange) {
        return 'failed';
    }

    return 'confirmed';
};
