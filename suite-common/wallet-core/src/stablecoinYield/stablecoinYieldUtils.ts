import {
    type TransactionDto,
    TransactionDtoStatus,
    TransactionDtoType,
    parseUnsignedEvmTransaction,
} from '@suite-common/earn-stablecoin-api';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    getContractAddressForNetworkSymbol,
    getEvmApprovalTxData,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type YieldFlowType, type YieldPendingTransactionState } from './stablecoinYieldTypes';

type TokenLike = {
    address?: string | null;
    symbol: string;
    decimals: number;
};

type NormalizedTokenAddressParams = {
    networkSymbol: NetworkSymbol;
    tokenAddress?: string | null;
};

type TokenMatchParams = {
    networkSymbol: NetworkSymbol;
    firstToken?: TokenLike;
    secondToken?: TokenLike;
};

type WithdrawRequestAmountParams = {
    networkSymbol: NetworkSymbol;
    amount: string;
    token: TokenLike;
    receiptToken: TokenLike;
    pricePerShare?: string | number;
};

export const splitYieldPendingTransaction = (
    pendingTransaction: YieldPendingTransactionState | null,
    actionKind: YieldFlowType,
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

/**
 * Extracts the vault contract address from supply/withdraw transactions.
 * This address serves as the ERC20 spender — useful when no explicit approval
 * transaction is present (token was already approved from a previous session).
 */
export const getYieldVaultAddressFromTransactions = (
    transactions: TransactionDto[],
): string | null => {
    const ACTION_TRANSACTION_TYPES = [
        ...SUPPLY_TRANSACTION_TYPES,
        ...WITHDRAW_TRANSACTION_TYPES,
    ] as readonly string[];

    const actionTx = sortYieldTransactions(transactions).find(tx =>
        ACTION_TRANSACTION_TYPES.includes(tx.type),
    );

    const parsed = parseUnsignedEvmTransaction(actionTx?.unsignedTransaction);

    return parsed?.to ?? null;
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
