import {
    type TransactionDto,
    TransactionDtoStatus,
    TransactionDtoType,
    parseUnsignedEvmTransaction,
} from '@suite-common/earn-stablecoin-api';
import type { Account } from '@suite-common/wallet-types';
import {
    getContractAddressForNetworkSymbol,
    getEvmApprovalTxData,
} from '@suite-common/wallet-utils';
import type { BulletListItemState } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { YIELD_FLOW_STEPS, type YieldFlowStepId, type YieldPendingTransactionState } from './types';

interface AmountComparisonParams {
    amount?: string;
    threshold?: string;
}

interface YieldModifyAmountInputParams {
    liveAmount?: string;
    actionAmount?: string | null;
    maxAmount: string;
}

interface TokenLike {
    address?: string | null;
    symbol: string;
    decimals: number;
}

interface NormalizedTokenAddressParams {
    networkSymbol: Account['symbol'];
    tokenAddress?: string | null;
}

interface TokenMatchParams {
    networkSymbol: Account['symbol'];
    firstToken?: TokenLike;
    secondToken?: TokenLike;
}

interface WithdrawRequestAmountParams {
    networkSymbol: Account['symbol'];
    amount: string;
    token: TokenLike;
    receiptToken: TokenLike;
    pricePerShare?: string | number;
}

export const splitYieldPendingTransaction = (
    pendingTransaction: YieldPendingTransactionState | null,
    actionKind: 'supply' | 'withdraw',
) => {
    const isApprovalPending =
        pendingTransaction?.type === 'approve' ||
        pendingTransaction?.type === 'revoke' ||
        pendingTransaction?.type === 'revoke-only';

    return {
        approvalPendingTransaction: isApprovalPending ? pendingTransaction : undefined,
        actionPendingTransaction:
            pendingTransaction?.type === actionKind ? pendingTransaction : undefined,
    };
};

export const isAmountGreaterThan = ({ amount, threshold }: AmountComparisonParams): boolean =>
    !!amount && !!threshold && new BigNumber(amount).gt(threshold);

export const getYieldModifyAmountInput = ({
    liveAmount,
    actionAmount,
    maxAmount,
}: YieldModifyAmountInputParams) => {
    const nextAmount = liveAmount || actionAmount || '';

    return isAmountGreaterThan({ amount: nextAmount, threshold: maxAmount })
        ? maxAmount
        : nextAmount;
};

const getNormalizedTokenAddress = ({
    networkSymbol,
    tokenAddress,
}: NormalizedTokenAddressParams): string | undefined => {
    if (!tokenAddress) {
        return undefined;
    }

    return getContractAddressForNetworkSymbol(networkSymbol, tokenAddress);
};

export const doTokensMatch = ({
    networkSymbol,
    firstToken,
    secondToken,
}: TokenMatchParams): boolean => {
    if (!firstToken || !secondToken) {
        return false;
    }

    const firstTokenAddress = getNormalizedTokenAddress({
        networkSymbol,
        tokenAddress: firstToken.address,
    });
    const secondTokenAddress = getNormalizedTokenAddress({
        networkSymbol,
        tokenAddress: secondToken.address,
    });

    if (firstTokenAddress && secondTokenAddress) {
        return firstTokenAddress === secondTokenAddress;
    }

    return (
        firstToken.symbol.toLowerCase() === secondToken.symbol.toLowerCase() &&
        firstToken.decimals === secondToken.decimals
    );
};

export const getWithdrawRequestAmount = ({
    networkSymbol,
    amount,
    token,
    receiptToken,
    pricePerShare,
}: WithdrawRequestAmountParams): string | null => {
    if (doTokensMatch({ networkSymbol, firstToken: token, secondToken: receiptToken })) {
        return amount;
    }

    if (!pricePerShare || new BigNumber(pricePerShare).lte(0)) {
        return null;
    }

    return new BigNumber(amount)
        .div(pricePerShare)
        .decimalPlaces(receiptToken.decimals, BigNumber.ROUND_DOWN)
        .toString();
};

export const sortYieldTransactions = (transactions: TransactionDto[]) =>
    [...transactions].sort(
        (firstTransaction, secondTransaction) =>
            (firstTransaction.stepIndex ?? Number.MAX_SAFE_INTEGER) -
            (secondTransaction.stepIndex ?? Number.MAX_SAFE_INTEGER),
    );

const SIGNABLE_TRANSACTION_STATUSES = [
    TransactionDtoStatus.CREATED,
    TransactionDtoStatus.WAITING_FOR_SIGNATURE,
] as const;

const isTransactionReadyForSigning = (transaction: TransactionDto) =>
    SIGNABLE_TRANSACTION_STATUSES.includes(
        transaction.status as (typeof SIGNABLE_TRANSACTION_STATUSES)[number],
    ) && !!transaction.unsignedTransaction;

const getApprovalTxDataType = (transaction: TransactionDto) => {
    const parsed = parseUnsignedEvmTransaction(transaction.unsignedTransaction);
    const approvalData = getEvmApprovalTxData(parsed?.data);

    return approvalData?.type ?? null;
};

export const getYieldRevokeTransaction = (transactions: TransactionDto[]) =>
    sortYieldTransactions(transactions).find(
        transaction =>
            transaction.type === TransactionDtoType.APPROVAL &&
            isTransactionReadyForSigning(transaction) &&
            getApprovalTxDataType(transaction) === 'revoke',
    );

export const getYieldApprovalTransaction = (transactions: TransactionDto[]) =>
    sortYieldTransactions(transactions).find(
        transaction =>
            transaction.type === TransactionDtoType.APPROVAL &&
            isTransactionReadyForSigning(transaction) &&
            getApprovalTxDataType(transaction) === 'approve',
    );

const SUPPLY_TRANSACTION_TYPES = [TransactionDtoType.SUPPLY, TransactionDtoType.DEPOSIT] as const;

const WITHDRAW_TRANSACTION_TYPES = [
    TransactionDtoType.WITHDRAW,
    TransactionDtoType.WITHDRAW_ALL,
] as const;

export const getYieldSupplyTransaction = (transactions: TransactionDto[]) =>
    sortYieldTransactions(transactions).find(
        transaction =>
            (SUPPLY_TRANSACTION_TYPES as readonly string[]).includes(transaction.type) &&
            isTransactionReadyForSigning(transaction),
    );

export const getYieldWithdrawTransaction = (transactions: TransactionDto[]) =>
    sortYieldTransactions(transactions).find(
        transaction =>
            (WITHDRAW_TRANSACTION_TYPES as readonly string[]).includes(transaction.type) &&
            isTransactionReadyForSigning(transaction),
    );

export const getYieldApprovalSpender = (transaction?: TransactionDto | null): string | null => {
    const parsedTransaction = parseUnsignedEvmTransaction(transaction?.unsignedTransaction);
    const approvalData = getEvmApprovalTxData(parsedTransaction?.data);

    return approvalData?.spender ?? null;
};

export const getYieldSpenderFromTransactions = (transactions: TransactionDto[]) => {
    const approvalTransaction = sortYieldTransactions(transactions).find(
        transaction =>
            transaction.type === TransactionDtoType.APPROVAL &&
            !!getYieldApprovalSpender(transaction),
    );

    return getYieldApprovalSpender(approvalTransaction);
};

const getYieldModalParams = (transaction?: TransactionDto | null) => {
    if (!transaction?.id) {
        return null;
    }

    const spender = getYieldApprovalSpender(transaction);

    if (!spender) {
        return null;
    }

    return {
        spender,
        transactionId: transaction.id,
    };
};

export const getYieldRevokeModalParams = (transactions: TransactionDto[]) => {
    const revokeTransaction = getYieldRevokeTransaction(transactions);

    return getYieldModalParams(revokeTransaction);
};

export const getYieldApprovalModalParams = (transactions: TransactionDto[]) => {
    const approvalTransaction = sortYieldTransactions(transactions).find(
        transaction =>
            transaction.type === TransactionDtoType.APPROVAL &&
            transaction.status !== TransactionDtoStatus.SKIPPED &&
            getApprovalTxDataType(transaction) === 'approve',
    );

    return getYieldModalParams(approvalTransaction);
};

export const getBulletListItemStates = (
    currentStep: YieldFlowStepId,
): Record<YieldFlowStepId, BulletListItemState> => {
    const currentStepIndex = YIELD_FLOW_STEPS.indexOf(currentStep);

    const getStepState = (stepId: YieldFlowStepId): BulletListItemState => {
        const stepIndex = YIELD_FLOW_STEPS.indexOf(stepId);

        if (stepIndex < currentStepIndex) {
            return 'done';
        }

        if (stepIndex === currentStepIndex) {
            return 'active';
        }

        return 'pending';
    };

    const stepStates = {
        approve: getStepState('approve'),
        action: getStepState('action'),
        complete: getStepState('complete'),
    } satisfies Record<YieldFlowStepId, BulletListItemState>;

    return stepStates;
};
