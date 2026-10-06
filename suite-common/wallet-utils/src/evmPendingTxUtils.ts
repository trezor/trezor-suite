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

interface FindTrackedEvmTransactionParams {
    transactions: WalletAccountTransaction[];
    txid: string;
    nonce?: number;
}

export const findTrackedEvmTransaction = ({
    transactions,
    txid,
    nonce,
}: FindTrackedEvmTransactionParams): TrackedEvmTransaction | undefined => {
    const originalTransaction = transactions.find(transaction => transaction.txid === txid);

    if (originalTransaction) {
        return { transaction: originalTransaction, isReplacement: false };
    }

    if (nonce === undefined) {
        return undefined;
    }

    // A replacement must have been signed by this account: only then is `ethereumSpecific.nonce`
    // this account's nonce counter. A foreign transaction that merely names the account carries the
    // *signer's* nonce, which can coincide with ours and would resolve the flow as a false failure.
    // Deliberately not `type !== 'recv'`: an incoming transaction that reverted on-chain is
    // relabelled 'failed' (see isTxFailed in blockchain-link-utils), so the display type alone
    // leaves that hole open.
    const replacementTransaction = transactions.find(
        transaction =>
            transaction.ethereumSpecific?.nonce === nonce && isSignedByAccount(transaction),
    );

    return replacementTransaction
        ? { transaction: replacementTransaction, isReplacement: true }
        : undefined;
};

export const getConfirmedEvmTransactionPurpose = (
    transaction: WalletAccountTransaction,
): EvmTransactionPurpose =>
    getEvmTransactionPurpose({
        networkSymbol: transaction.symbol,
        to: getWrappedNativeTxTarget(transaction),
        data: transaction.ethereumSpecific?.data,
    });

type GetEvmPendingTxStatusParams = {
    txid: string | null;
    trackedTransaction?: TrackedEvmTransaction;
    expectedPurpose: EvmTransactionPurpose;
};

export const getEvmPendingTxStatus = ({
    txid,
    trackedTransaction,
    expectedPurpose,
}: GetEvmPendingTxStatusParams): EvmPendingTxStatus | null => {
    if (!txid) return null;

    if (!trackedTransaction || isPending(trackedTransaction.transaction)) {
        return 'pending';
    }

    // Only a replacement needs checking: a transaction confirmed under the tracked txid can only
    // carry the calldata that was signed, while a replacement is a different transaction that
    // merely reuses the nonce.
    const didOperationChange =
        trackedTransaction.isReplacement &&
        getConfirmedEvmTransactionPurpose(trackedTransaction.transaction) !== expectedPurpose;

    if (trackedTransaction.transaction.type === 'failed' || didOperationChange) {
        return 'failed';
    }

    return 'confirmed';
};
