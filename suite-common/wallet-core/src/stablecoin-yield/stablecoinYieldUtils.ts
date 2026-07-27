import { Calldata, type EvmAddress } from '@suite-common/calldata';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import { type AccountKey, type EvmSelectedFee } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    fromGwei,
    fromIntegerString,
    getContractAddressForNetworkSymbol,
    isWrappedNativeToken,
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
    /** Native value carried by the transaction (hex). Non-zero for wraps; defaults to `0x0`. */
    value?: string;
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
 *
 * The full sequence (wrap/unwrap included) is used to locate `step`, so an optional step
 * such as `wrap` can be advanced from. Optional steps are skipped as *targets* though —
 * they are entered explicitly (e.g. `wrap` is left via `skipWrapStep`), never as the
 * automatic next step of the preceding one.
 */
export const getNextYieldFlowStep = (
    flowType: YieldFlowType,
    step: YieldFlowStepId,
): YieldFlowStepId => {
    const sequence = getYieldFlowStepSequence({ flowType, isWrappedNativeVault: true });
    const stepIndex = sequence.indexOf(step);

    if (stepIndex === -1) {
        return step;
    }

    const nextStep = sequence.slice(stepIndex + 1).find(s => s !== 'wrap' && s !== 'unwrap');

    return nextStep ?? step;
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
    value = '0x0',
}: BuildYieldUnsignedTransactionParams) => {
    const feeFields = buildEvmFeeFields({ feeLevel, gasLimit });
    const commonFields = {
        from,
        to,
        data,
        value,
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

type BuildYieldWrapTransactionDataParams = {
    wrapAmount: string;
    decimals: number;
};

// WETH `deposit()` carries the wrapped amount in the transaction value, not in calldata.
export const buildYieldWrapTransactionData = ({
    wrapAmount,
    decimals,
}: BuildYieldWrapTransactionDataParams) => {
    const builderResult = Calldata.evm.weth.deposit.encode({});

    if (!builderResult.isValid || !builderResult.data) {
        throw new Error('Failed to encode WETH deposit calldata.');
    }

    const valueSubunits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(wrapAmount)),
        decimals,
    });

    return {
        data: builderResult.data,
        value: fromIntegerString(valueSubunits.toFixed(0)).toHex(),
    };
};

type BuildYieldUnwrapTransactionDataParams = {
    unwrapAmount: string;
    decimals: number;
};

export const buildYieldUnwrapTransactionData = ({
    unwrapAmount,
    decimals,
}: BuildYieldUnwrapTransactionDataParams) => {
    const wadSubunits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(unwrapAmount)),
        decimals,
    });

    const builderResult = Calldata.evm.weth.withdraw.encode({ wad: wadSubunits });

    if (!builderResult.isValid || !builderResult.data) {
        const issues = builderResult.errors.map(issue => issue.code).join(', ');

        throw new Error(`Failed to encode WETH withdraw calldata${issues ? `: ${issues}` : '.'}`);
    }

    return { data: builderResult.data };
};

type GetYieldDepositableBalanceParams = {
    networkSymbol: NetworkSymbol;
    /** Native coin balance in display units, NOT subunits. */
    nativeFormattedBalance: string;
    vaultTokenAddress?: string | null;
    matchedTokenBalance?: string | null;
};

/**
 * Balance available for a yield deposit. For a wrapped-native (WETH) vault the native balance can
 * be wrapped, so it counts in after keeping `WETH_WRAP_GAS_RESERVE` aside to cover the follow-up
 * wrap + approve + deposit (+ exit) fees.
 */
export const getYieldDepositableBalance = ({
    networkSymbol,
    nativeFormattedBalance,
    vaultTokenAddress,
    matchedTokenBalance,
}: GetYieldDepositableBalanceParams): string => {
    // Normal deposit: only the already-held vault-token balance is spendable.
    const tokenDepositBalance = matchedTokenBalance ?? '0';

    if (!isWrappedNativeToken(networkSymbol, vaultTokenAddress)) {
        return tokenDepositBalance;
    }

    // Native-asset deposit: the native balance can also be wrapped, after keeping the fee reserve
    // aside for the follow-up wrap + approve + deposit (+ exit) transactions.
    const wrappableNativeBalance = BigNumber.max(
        0,
        new BigNumber(nativeFormattedBalance || '0').minus(WETH_WRAP_GAS_RESERVE),
    );

    return new BigNumber(tokenDepositBalance).plus(wrappableNativeBalance).toString();
};

type GetYieldWrapAmountParams = {
    totalAmount: string;
    matchedWethBalance?: string | null;
};

/** Native portion of a deposit that must be wrapped — the total minus already-held WETH. */
export const getYieldWrapAmount = ({
    totalAmount,
    matchedWethBalance,
}: GetYieldWrapAmountParams): string =>
    BigNumber.max(0, new BigNumber(totalAmount || '0').minus(matchedWethBalance || '0')).toString();

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
