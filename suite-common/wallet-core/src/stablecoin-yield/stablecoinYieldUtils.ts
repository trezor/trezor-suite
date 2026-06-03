import { numberToHex, toWei } from 'web3-utils';

import { Calldata, type EvmAddress } from '@suite-common/calldata';
import {
    type TransactionDto,
    TransactionDtoStatus,
    TransactionDtoType,
    type YieldDto,
    parseUnsignedEvmTransaction,
} from '@suite-common/earn-stablecoin-api';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type EvmSelectedFee } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    getContractAddressForNetworkSymbol,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import type {
    YieldFlowDisplayToken,
    YieldFlowResolvedData,
    YieldFlowType,
    YieldPendingTransactionState,
    YieldWithdrawInputUnit,
} from './stablecoinYieldTypes';

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

type ConvertOutputTokenBalanceParams = {
    networkSymbol: NetworkSymbol;
    token: TokenLike;
    outputToken?: TokenLike;
    outputTokenBalance?: string | null;
    pricePerShareState?: {
        shareToken: TokenLike;
        quoteToken: TokenLike;
        price: string | number;
    };
};

type GetStablecoinYieldFlowKeyParams = {
    accountKey: AccountKey;
    tokenContract?: string | null;
    yieldId: string;
};

type EvmFeeLevel = {
    baseFeePerGas?: string;
    feePerUnit: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
};

type BuildYieldWithdrawCalldataParams = {
    amount: string;
    flowData: YieldFlowResolvedData;
    ownerAddress: EvmAddress;
    receiverAddress: EvmAddress;
    withdrawInputUnit: YieldWithdrawInputUnit;
};

type BuildYieldWithdrawUnsignedTransactionParams = {
    chainId: number;
    data: string;
    feeLevel: EvmFeeLevel;
    from: string;
    gasLimit: string;
    nonce: number;
    to: string;
};

type BuildEvmFeeFieldsParams = {
    feeLevel: EvmFeeLevel;
    gasLimit: string;
};

export const getStablecoinYieldFlowKey = ({
    accountKey,
    tokenContract,
    yieldId,
}: GetStablecoinYieldFlowKeyParams) =>
    `${accountKey}:${yieldId}:${tokenContract?.toLowerCase() ?? ''}`;

export const getYieldWithdrawInputToken = ({
    flowData,
    withdrawInputUnit,
}: {
    flowData: YieldFlowResolvedData;
    withdrawInputUnit: YieldWithdrawInputUnit;
}): YieldFlowDisplayToken =>
    withdrawInputUnit === 'shares' ? flowData.receiptToken : flowData.token;

export const buildYieldWithdrawCalldata = ({
    amount,
    flowData,
    ownerAddress,
    receiverAddress,
    withdrawInputUnit,
}: BuildYieldWithdrawCalldataParams) => {
    const isSharesInput = withdrawInputUnit === 'shares';
    const inputToken = getYieldWithdrawInputToken({ flowData, withdrawInputUnit });
    const amountSubunits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        decimals: inputToken.decimals,
    });

    const builderResult = isSharesInput
        ? Calldata.evm.erc4626.redeem.encode(
              {
                  shares: amountSubunits,
                  receiver: receiverAddress,
                  owner: ownerAddress,
              },
              { sender: ownerAddress },
          )
        : Calldata.evm.erc4626.withdraw.encode(
              {
                  assets: amountSubunits,
                  receiver: receiverAddress,
                  owner: ownerAddress,
              },
              { sender: ownerAddress },
          );

    if (!builderResult.isValid || !builderResult.data) {
        const issues = builderResult.errors.map(issue => issue.code).join(', ');

        throw new Error(`Failed to encode withdraw calldata${issues ? `: ${issues}` : '.'}`);
    }

    return builderResult.data;
};

export const buildEvmFeeFields = ({ feeLevel, gasLimit }: BuildEvmFeeFieldsParams) => {
    const commonFields = {
        gasLimit: numberToHex(gasLimit),
    };

    if (feeLevel.maxFeePerGas && feeLevel.maxPriorityFeePerGas) {
        return {
            ...commonFields,
            maxFeePerGas: numberToHex(toWei(feeLevel.maxFeePerGas, 'gwei')),
            maxPriorityFeePerGas: numberToHex(toWei(feeLevel.maxPriorityFeePerGas, 'gwei')),
        };
    }

    return {
        ...commonFields,
        gasPrice: numberToHex(toWei(feeLevel.feePerUnit, 'gwei')),
    };
};

export const buildEvmSelectedFee = ({
    feeLevel,
    gasLimit,
}: BuildEvmFeeFieldsParams): EvmSelectedFee => {
    const feeFields = buildEvmFeeFields({ feeLevel, gasLimit });

    if ('maxFeePerGas' in feeFields && 'maxPriorityFeePerGas' in feeFields) {
        return {
            type: 'eip1559',
            ...feeFields,
            baseFeePerGas: numberToHex(toWei(feeLevel.baseFeePerGas ?? '0', 'gwei')),
        };
    }

    return {
        type: 'legacy',
        ...feeFields,
    };
};

export const buildYieldWithdrawUnsignedTransaction = ({
    chainId,
    data,
    feeLevel,
    from,
    gasLimit,
    nonce,
    to,
}: BuildYieldWithdrawUnsignedTransactionParams) => {
    const feeFields = buildEvmFeeFields({ feeLevel, gasLimit });
    const commonFields = {
        from,
        to,
        data,
        value: '0x0',
        nonce,
        chainId,
        gasLimit: feeFields.gasLimit,
    };

    if ('maxFeePerGas' in feeFields && 'maxPriorityFeePerGas' in feeFields) {
        return {
            ...commonFields,
            type: 2,
            maxFeePerGas: feeFields.maxFeePerGas,
            maxPriorityFeePerGas: feeFields.maxPriorityFeePerGas,
        };
    }

    return {
        ...commonFields,
        gasPrice: feeFields.gasPrice,
    };
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

export const getConvertedOutputTokenBalanceToInputTokenAmount = ({
    networkSymbol,
    token,
    outputToken,
    outputTokenBalance,
    pricePerShareState,
}: ConvertOutputTokenBalanceParams) => {
    if (!outputTokenBalance) {
        return '0';
    }

    if (doTokensMatch({ networkSymbol, firstToken: outputToken, secondToken: token })) {
        return outputTokenBalance;
    }

    if (
        !pricePerShareState ||
        !doTokensMatch({
            networkSymbol,
            firstToken: pricePerShareState.shareToken,
            secondToken: outputToken,
        }) ||
        !doTokensMatch({
            networkSymbol,
            firstToken: pricePerShareState.quoteToken,
            secondToken: token,
        })
    ) {
        return '0';
    }

    return new BigNumber(outputTokenBalance)
        .times(pricePerShareState.price)
        .decimalPlaces(token.decimals, BigNumber.ROUND_DOWN)
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
    const approvalData = Calldata.evm.erc20.approve.decode(parsed?.data);
    if (!approvalData) return null;

    return approvalData.amount === 0n ? 'revoke' : 'approve';
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
    const approvalData = Calldata.evm.erc20.approve.decode(parsedTransaction?.data);

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

const getVaultAddressFromYieldId = (yieldId: string) =>
    yieldId.match(/0x[a-fA-F0-9]{40}/)?.[0] ?? null;

export const getYieldVaultContractAddress = (vault: Pick<YieldDto, 'id' | 'outputToken'>) =>
    vault.outputToken?.address ?? getVaultAddressFromYieldId(vault.id);

export const getAllowanceSpender = (flowData: YieldFlowResolvedData) =>
    flowData.receiptToken.contractAddress ?? getYieldVaultContractAddress(flowData.vault);
