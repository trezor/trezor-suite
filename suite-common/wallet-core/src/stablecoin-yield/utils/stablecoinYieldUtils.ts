import { Calldata, type EvmAddress } from '@suite-common/calldata';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol, getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import { type AccountKey, type EvmSelectedFee } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    fromGwei,
    fromIntegerString,
    getContractAddressForNetworkSymbol,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import { YIELD_FLOW_AVAILABLE_STEPS } from '../stablecoinYieldConstants';
import type {
    YieldFlowDisplayToken,
    YieldFlowResolvedData,
    YieldFlowStepId,
    YieldFlowType,
    YieldPendingTransactionState,
    YieldWithdrawFlowType,
} from '../stablecoinYieldTypes';

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

/** Returns the next step in the sequence selected for the current vault. */
export const getNextYieldFlowStep = (
    flowType: YieldFlowType,
    step: YieldFlowStepId,
    isWrappedNativeVault = false,
): YieldFlowStepId => {
    const sequence = getYieldFlowStepSequence({ flowType, isWrappedNativeVault });
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
 * Native balance that can be wrapped, after keeping `WETH_WRAP_GAS_RESERVE` aside to cover the
 * follow-up wrap + approve + deposit (+ exit) fees.
 */
export const getWrappableNativeBalance = (nativeFormattedBalance: string): string =>
    BigNumber.max(
        0,
        new BigNumber(nativeFormattedBalance || '0').minus(WETH_WRAP_GAS_RESERVE),
    ).toString();

/**
 * Amount the wrap step's "Max" button fills in: the balance minus `WETH_WRAP_GAS_RESERVE` while
 * that leaves something to wrap, otherwise the whole balance. A balance at or below the reserve
 * has nothing to keep aside, and offering `0` reads as a dead button
 * (trezor/trezor-suite#30842). Wrapping it all is allowed, and `shouldRecommendWrapReserve` then
 * surfaces the non-blocking recommendation to keep some native coin for the follow-up fees.
 */
export const getMaxWrapAmount = (nativeFormattedBalance: string): string => {
    const balance = new BigNumber(nativeFormattedBalance || '0');

    if (!balance.isFinite() || balance.lte(0)) {
        return '0';
    }

    const wrappableBalance = new BigNumber(getWrappableNativeBalance(nativeFormattedBalance));

    return wrappableBalance.gt(0) ? wrappableBalance.toString() : balance.toString();
};

/**
 * Whether wrapping `amountInput` out of `nativeFormattedBalance` would leave at most
 * `WETH_WRAP_GAS_RESERVE` behind — i.e. no safety margin above the reserve needed for the
 * follow-up approve + deposit fees. Used to surface a non-blocking recommendation to keep a
 * reserve; this also covers the "Max" amount, which leaves exactly the reserve.
 *
 * The amount is assumed to be within the balance; wrapping more than the whole balance is a
 * hard "insufficient funds" error handled separately, so it does not count as a recommendation.
 */
export const shouldRecommendWrapReserve = (
    amountInput: string,
    nativeFormattedBalance: string,
): boolean => {
    const amount = new BigNumber(amountInput || '0');
    const balance = new BigNumber(nativeFormattedBalance || '0');

    if (!amount.isFinite() || !balance.isFinite()) {
        return false;
    }

    return amount.gt(0) && amount.lte(balance) && balance.minus(amount).lte(WETH_WRAP_GAS_RESERVE);
};

/**
 * Balance available for a yield deposit. For a wrapped-native (WETH) vault the native balance can
 * be wrapped, so the full native balance counts in on top of the already-held wrapped token. The
 * `WETH_WRAP_GAS_RESERVE` is intentionally NOT deducted here — the summary shows the user's full
 * depositable amount (native + wrapped); the fee reserve is a concern of the deposit flow, not the
 * headline figure.
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

    // Native-asset deposit: the full native balance can be wrapped and counts in.
    return new BigNumber(tokenDepositBalance).plus(nativeFormattedBalance || '0').toString();
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

type GetYieldDepositAvailableBalanceParams = {
    tokenBalance?: string | null;
    wrappedAmount?: string | null;
};

/**
 * Balance a yield deposit amount is validated against. Right after a wrap the account can still
 * report the pre-wrap wrapped-token balance — deposit() emits no ERC-20 transfer, so the backend
 * omits the token until it is tracked — which would block the very deposit the flow wrapped for.
 * The just-wrapped amount is a lower bound of what the account holds, and taking the larger of
 * the two cannot double-count: a refreshed balance already includes the wrap.
 */
export const getYieldDepositAvailableBalance = ({
    tokenBalance,
    wrappedAmount,
}: GetYieldDepositAvailableBalanceParams): string => {
    const balance = new BigNumber(tokenBalance || '0');
    const wrapped = new BigNumber(wrappedAmount || '0');

    return BigNumber.max(
        balance.isFinite() ? balance : 0,
        wrapped.isFinite() ? wrapped : 0,
    ).toString();
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

export const isYieldVaultOperational = (vault: Pick<YieldDtoV2, 'metadata'>): boolean =>
    !vault.metadata.underMaintenance && !vault.metadata.deprecated;

type YieldVaultMatchFields = Pick<
    YieldDtoV2,
    'metadata' | 'network' | 'status' | 'token' | 'outputToken'
>;

type GetYieldVaultsForTokenParams<TVault extends YieldVaultMatchFields> = {
    vaults: TVault[] | undefined;
    networkSymbol: NetworkSymbol;
    token: TokenLike;
};

const isYieldVaultOnNetwork = (vault: YieldVaultMatchFields, networkSymbol: NetworkSymbol) =>
    getNetworkByYieldXyzId(vault.network)?.symbol === networkSymbol;

// Input-token matching invites a deposit, so it also requires deposits to be open.
export const getYieldVaultsForInputToken = <TVault extends YieldVaultMatchFields>({
    vaults,
    networkSymbol,
    token,
}: GetYieldVaultsForTokenParams<TVault>): TVault[] =>
    (vaults ?? []).filter(
        vault =>
            isYieldVaultOperational(vault) &&
            vault.status.enter &&
            isYieldVaultOnNetwork(vault, networkSymbol) &&
            doTokensMatch({ networkSymbol, firstToken: token, secondToken: vault.token }),
    );

export const getYieldVaultForOutputToken = <TVault extends YieldVaultMatchFields>({
    vaults,
    networkSymbol,
    token,
}: GetYieldVaultsForTokenParams<TVault>): TVault | undefined =>
    vaults?.find(
        vault =>
            isYieldVaultOperational(vault) &&
            isYieldVaultOnNetwork(vault, networkSymbol) &&
            doTokensMatch({ networkSymbol, firstToken: token, secondToken: vault.outputToken }),
    );

type YieldVaultPositionParams = {
    networkSymbol: NetworkSymbol;
    vault: Pick<YieldDtoV2, 'outputToken'>;
    accountTokens: Pick<TokenInfo, 'contract' | 'symbol' | 'decimals' | 'balance'>[] | undefined;
};

/** Whether the account already holds the vault's receipt token, i.e. has deposited into it. */
export const hasYieldVaultPosition = ({
    networkSymbol,
    vault,
    accountTokens,
}: YieldVaultPositionParams): boolean =>
    (accountTokens ?? []).some(
        accountToken =>
            accountToken.symbol !== undefined &&
            doTokensMatch({
                networkSymbol,
                firstToken: {
                    address: accountToken.contract,
                    symbol: accountToken.symbol,
                    decimals: accountToken.decimals,
                },
                secondToken: vault.outputToken,
            }) &&
            new BigNumber(accountToken.balance ?? '0').gt(0),
    );

export const getYieldVaultAddress = (flowData: YieldFlowResolvedData) =>
    flowData.receiptToken.contractAddress ?? getYieldVaultContractAddress(flowData.vault);
