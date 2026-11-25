import {
    type EvmTransactionPurpose,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { getEvmTransactionPurpose, getWrappedNativeTxTarget } from './ethUtils';
import { isPending, isSignedByAccount } from './transactionUtils';

export type EvmPendingTxStatus = 'pending' | 'confirmed' | 'failed';

/** The call an EVM transaction makes: where it goes, with what calldata and what native value. */
export interface EvmOperation {
    to: string;
    data?: string;
    // In wei, as a decimal or a hex quantity.
    value?: string;
}

const normalizeCalldata = (data: string | undefined) => {
    const hex = (data ?? '').toLowerCase();

    return hex.startsWith('0x') ? hex.slice(2) : hex;
};

export const getEvmTransactionOperation = (
    transaction: Pick<WalletAccountTransaction, 'targets' | 'details' | 'ethereumSpecific'>,
): EvmOperation | null => {
    const [output] = transaction.details.vout;
    // A pending token transfer the app records itself has no target, only the raw output.
    const to = transaction.targets[0]?.addresses?.[0] ?? output?.addresses?.[0];

    if (to === undefined) {
        return null;
    }

    return { to, data: transaction.ethereumSpecific?.data, value: output?.value };
};

export const isSameEvmOperation = (operation: EvmOperation, other: EvmOperation): boolean =>
    operation.to.toLowerCase() === other.to.toLowerCase() &&
    normalizeCalldata(operation.data) === normalizeCalldata(other.data) &&
    new BigNumber(operation.value || 0).eq(other.value || 0);

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
    // When given, a replacement has to make exactly this call, not just one of the same purpose.
    expectedOperation?: EvmOperation;
};

type IsExpectedEvmOperationParams = {
    transaction: WalletAccountTransaction;
    expectedPurpose: EvmTransactionPurpose;
    expectedOperation?: EvmOperation;
};

const isExpectedEvmOperation = ({
    transaction,
    expectedPurpose,
    expectedOperation,
}: IsExpectedEvmOperationParams) => {
    if (expectedOperation === undefined) {
        return getConfirmedEvmTransactionPurpose(transaction) === expectedPurpose;
    }

    const operation = getEvmTransactionOperation(transaction);

    return operation !== null && isSameEvmOperation(operation, expectedOperation);
};

type GetEvmReplacementTxidParams = {
    trackedTransaction?: TrackedEvmTransaction;
    expectedOperation: EvmOperation;
};

/** The hash to follow once a replacement is known to make the very call that was submitted. */
export const getEvmReplacementTxid = ({
    trackedTransaction,
    expectedOperation,
}: GetEvmReplacementTxidParams): string | undefined => {
    if (!trackedTransaction?.isReplacement) {
        return undefined;
    }

    const operation = getEvmTransactionOperation(trackedTransaction.transaction);

    return operation !== null && isSameEvmOperation(operation, expectedOperation)
        ? trackedTransaction.transaction.txid
        : undefined;
};

export const getEvmPendingTxStatus = ({
    txid,
    trackedTransaction,
    expectedPurpose,
    expectedOperation,
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
        !isExpectedEvmOperation({
            transaction: trackedTransaction.transaction,
            expectedPurpose,
            expectedOperation,
        });

    if (trackedTransaction.transaction.type === 'failed' || didOperationChange) {
        return 'failed';
    }

    return 'confirmed';
};
