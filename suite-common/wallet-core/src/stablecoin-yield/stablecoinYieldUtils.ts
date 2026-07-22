import { Calldata, type EvmAddress } from '@suite-common/calldata';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type EvmSelectedFee } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    fromGwei,
    fromIntegerString,
    getContractAddressForNetworkSymbol,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { YIELD_FLOW_AVAILABLE_STEPS } from './stablecoinYieldConstants';
import type {
    YieldFlowDisplayToken,
    YieldFlowResolvedData,
    YieldFlowStepId,
    YieldFlowType,
    YieldPendingTransactionState,
    YieldWithdrawFlowType,
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
    flowType: YieldWithdrawFlowType;
};

type BuildYieldDepositCalldataParams = {
    amount: string;
    flowData: YieldFlowResolvedData;
    ownerAddress: EvmAddress;
    receiverAddress: EvmAddress;
};

type BuildYieldUnsignedTransactionParams = {
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

export const isYieldWithdrawFlow = (flowType: YieldFlowType): flowType is YieldWithdrawFlowType =>
    flowType === 'withdraw' || flowType === 'redeem';

type GetYieldFlowStepSequenceParams<TFlowType extends YieldFlowType> = {
    flowType: TFlowType;
    isWrappedNativeVault?: boolean;
};

type YieldFlowStepOf<TFlowType extends YieldFlowType> =
    (typeof YIELD_FLOW_AVAILABLE_STEPS)[TFlowType][number];

type YieldFlowStepSequence<TFlowType extends YieldFlowType> = readonly [
    YieldFlowStepOf<TFlowType>,
    ...YieldFlowStepOf<TFlowType>[],
];

export const getYieldFlowStepSequence = <TFlowType extends YieldFlowType>({
    flowType,
    isWrappedNativeVault = false,
}: GetYieldFlowStepSequenceParams<TFlowType>): YieldFlowStepSequence<TFlowType> => {
    const availableSteps: readonly YieldFlowStepOf<TFlowType>[] =
        YIELD_FLOW_AVAILABLE_STEPS[flowType];

    const sequence: readonly YieldFlowStepOf<TFlowType>[] = availableSteps.filter(step =>
        step === 'wrap' || step === 'unwrap' ? isWrappedNativeVault : true,
    );

    // Every flow keeps its unconditional 'action' and 'complete' steps, so the
    // filtered sequence is never empty.
    return sequence as YieldFlowStepSequence<TFlowType>;
};

/**
 * Returns the step that follows `step` in the flow's step sequence. Stays on `step`
 * when it is the last one or not part of the flow at all.
 */
export const getNextYieldFlowStep = (
    flowType: YieldFlowType,
    step: YieldFlowStepId,
): YieldFlowStepId => {
    const sequence = getYieldFlowStepSequence({ flowType });
    const stepIndex = sequence.indexOf(step);

    if (stepIndex === -1) {
        return step;
    }

    return sequence[stepIndex + 1] ?? step;
};

export const getYieldWithdrawInputToken = ({
    flowData,
    flowType,
}: {
    flowData: YieldFlowResolvedData;
    flowType: YieldWithdrawFlowType;
}): YieldFlowDisplayToken => (flowType === 'redeem' ? flowData.receiptToken : flowData.token);

export const buildYieldWithdrawCalldata = ({
    amount,
    flowData,
    ownerAddress,
    receiverAddress,
    flowType,
}: BuildYieldWithdrawCalldataParams) => {
    const isRedeem = flowType === 'redeem';
    const inputToken = getYieldWithdrawInputToken({ flowData, flowType });
    const amountSubunits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        decimals: inputToken.decimals,
    });

    const builderResult = isRedeem
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

export const buildYieldDepositCalldata = ({
    amount,
    flowData,
    ownerAddress,
    receiverAddress,
}: BuildYieldDepositCalldataParams) => {
    const amountSubunits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        decimals: flowData.token.decimals,
    });

    const builderResult = Calldata.evm.erc4626.deposit.encode(
        {
            assets: amountSubunits,
            receiver: receiverAddress,
        },
        { sender: ownerAddress },
    );

    if (!builderResult.isValid || !builderResult.data) {
        const issues = builderResult.errors.map(issue => issue.code).join(', ');

        throw new Error(`Failed to encode deposit calldata${issues ? `: ${issues}` : '.'}`);
    }

    return builderResult.data;
};

export const buildEvmFeeFields = ({ feeLevel, gasLimit }: BuildEvmFeeFieldsParams) => {
    const commonFields = {
        gasLimit: fromIntegerString(gasLimit).toHex(),
    };

    if (feeLevel.maxFeePerGas && feeLevel.maxPriorityFeePerGas) {
        return {
            ...commonFields,
            maxFeePerGas: fromGwei(feeLevel.maxFeePerGas).toWei('hex'),
            maxPriorityFeePerGas: fromGwei(feeLevel.maxPriorityFeePerGas).toWei('hex'),
        };
    }

    return {
        ...commonFields,
        gasPrice: fromGwei(feeLevel.feePerUnit).toWei('hex'),
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
            baseFeePerGas: fromGwei(feeLevel.baseFeePerGas ?? '0').toWei('hex'),
        };
    }

    return {
        type: 'legacy',
        ...feeFields,
    };
};

export const buildYieldUnsignedTransaction = ({
    chainId,
    data,
    feeLevel,
    from,
    gasLimit,
    nonce,
    to,
}: BuildYieldUnsignedTransactionParams) => {
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

type YieldTxReviewFlowIdentity = {
    accountKey?: AccountKey;
    flowKey?: string;
    flowType?: YieldFlowType;
    createdTimestamp?: number;
};

type YieldTxReviewFlowMatchParams = {
    accountKey: AccountKey;
    flowKey: string;
    flowType: YieldFlowType;
    notBefore?: number;
};

export const isYieldTxReviewForFlow = (
    txReview: YieldTxReviewFlowIdentity,
    { accountKey, flowKey, flowType, notBefore }: YieldTxReviewFlowMatchParams,
) =>
    txReview.accountKey === accountKey &&
    txReview.flowKey === flowKey &&
    txReview.flowType === flowType &&
    (notBefore === undefined || (txReview.createdTimestamp ?? 0) >= notBefore);

export const splitYieldPendingTransaction = (
    pendingTransaction: YieldPendingTransactionState | null,
    actionKind: YieldFlowType,
) => {
    const isApprovalPending =
        pendingTransaction?.type === 'approve' || pendingTransaction?.type === 'revoke';

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

const getVaultAddressFromYieldId = (yieldId: string) =>
    yieldId.match(/0x[a-fA-F0-9]{40}/)?.[0] ?? null;

export const getYieldVaultContractAddress = (vault: Pick<YieldDtoV2, 'id' | 'outputToken'>) =>
    vault.outputToken?.address ?? getVaultAddressFromYieldId(vault.id);

export const getAllowanceSpender = (flowData: YieldFlowResolvedData) =>
    flowData.receiptToken.contractAddress ?? getYieldVaultContractAddress(flowData.vault);
