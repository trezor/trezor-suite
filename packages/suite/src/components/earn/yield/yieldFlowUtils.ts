import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type YieldAllowanceStatus,
    type YieldFlowDisplayToken,
    type YieldFlowStepId,
    type YieldFlowToken,
    type YieldPositionFlowType,
    type YieldWithdrawFlowType,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    isYieldWithdrawFlow,
} from '@suite-common/wallet-core';
import { type TokenAddress, toTokenAddress } from '@suite-common/wallet-types';
import {
    fromBaseCurrencyToCryptoUnit,
    getContractAddressForNetworkSymbol,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import type { StepListItemState } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

export { getYieldApprovalAction, type YieldApprovalAction } from '@suite-common/wallet-core';

const FIAT_DISPLAY_DECIMALS = 2;

type AmountComparisonParams = {
    amount?: string;
    threshold?: string;
};

type YieldModifyAmountInputParams = {
    liveAmount?: string;
    actionAmount?: string | null;
    maxAmount: string;
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

type YieldUnwrapDefaultAmountParams = {
    flowType: YieldWithdrawFlowType;
    /** Amount just withdrawn, in the flow's input unit — assets for `withdraw`, shares for `redeem`. */
    withdrawnAmount: string;
    /** Vault asset token being unwrapped (the wrapped-native token, e.g. WETH). */
    token: YieldFlowToken;
    /** Vault receipt/share token (e.g. trSHETHp). */
    receiptToken: YieldFlowDisplayToken;
    pricePerShareState?: Parameters<
        typeof getConvertedOutputTokenBalanceToInputTokenAmount
    >[0]['pricePerShareState'];
    /** Fallback used when the withdrawn asset amount can't be resolved (e.g. missing price). */
    fallbackAmount: string;
};

/**
 * Amount to pre-fill in the withdraw flow's unwrap (wrapped-native → native) step.
 *
 * It must default to the asset amount that was just withdrawn — NOT the account's full
 * wrapped-native balance, which would sweep in unrelated WETH the user never meant to unwrap
 * (see trezor/trezor-suite#30559). A `withdraw` yields the asset amount directly; a `redeem`
 * yields shares, so those are converted to their asset (WETH) equivalent via the vault
 * price-per-share. Falls back to the full balance only when the asset amount can't be resolved.
 */
export const getYieldUnwrapDefaultAmount = ({
    flowType,
    withdrawnAmount,
    token,
    receiptToken,
    pricePerShareState,
    fallbackAmount,
}: YieldUnwrapDefaultAmountParams): string => {
    const withdrawnAssetAmount =
        flowType === 'redeem'
            ? getConvertedOutputTokenBalanceToInputTokenAmount({
                  networkSymbol: token.networkSymbol,
                  token,
                  outputToken: receiptToken,
                  outputTokenBalance: withdrawnAmount,
                  pricePerShareState,
              })
            : withdrawnAmount;

    if (!withdrawnAssetAmount || new BigNumber(withdrawnAssetAmount).lte(0)) {
        return fallbackAmount;
    }

    return withdrawnAssetAmount;
};

type ShouldInitializeYieldAllowanceParams = {
    isWrappedNativeVault: boolean;
    /** Whether the Redux session already reflects that shape; false until `initSession` lands. */
    hasWrappedNativeSession: boolean;
    step: YieldFlowStepId;
    allowanceStatus: YieldAllowanceStatus;
};

/**
 * Whether the on-chain allowance should be read now.
 *
 * A wrapped-native deposit must not read it before the wrap step resolves: the amount to approve
 * is only known then, and a leftover dust allowance would otherwise auto-skip the approve step
 * (see trezor/trezor-suite#30551). From the approve step onwards it must be read again whenever
 * it is invalidated — including on the action step, which a confirmed approval invalidates.
 * Leaving it idle there hides the fetch-failure banner and permanently disables the
 * insufficient-approval warning.
 */
export const shouldInitializeYieldAllowance = ({
    isWrappedNativeVault,
    hasWrappedNativeSession,
    step,
    allowanceStatus,
}: ShouldInitializeYieldAllowanceParams): boolean => {
    if (allowanceStatus !== 'idle') {
        return false;
    }

    if (!isWrappedNativeVault) {
        return true;
    }

    return hasWrappedNativeSession && (step === 'approve' || step === 'action');
};

export type YieldFiatRateToken = {
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
};

type YieldFiatRateTokenParams = {
    step: YieldFlowStepId;
    flowType: YieldPositionFlowType;
    accountSymbol: NetworkSymbol;
    token: Pick<YieldFlowDisplayToken, 'networkSymbol' | 'contractAddress'> | null;
};

/**
 * The token whose fiat rate prices the amount currently being entered:
 * - wrap/unwrap operate on the native coin (priced by the account's native symbol),
 * - withdraw/redeem have no fiat entry,
 * - deposit/approve enter the vault asset token (priced by its contract address).
 *
 * Returns `null` when fiat entry is not possible for the current step.
 */
export const getYieldFiatRateToken = ({
    step,
    flowType,
    accountSymbol,
    token,
}: YieldFiatRateTokenParams): YieldFiatRateToken | null => {
    if (step === 'wrap' || step === 'unwrap') {
        return { symbol: accountSymbol };
    }

    if (isYieldWithdrawFlow(flowType)) {
        return null;
    }

    if (!token?.contractAddress) {
        return null;
    }

    return {
        symbol: token.networkSymbol,
        tokenAddress: toTokenAddress(
            getContractAddressForNetworkSymbol(token.networkSymbol, token.contractAddress),
        ),
    };
};

/** Crypto → fiat for display. Empty string when the amount is empty or no rate is available. */
export const getYieldFiatInputValue = ({
    amount,
    rate,
}: {
    amount: string;
    rate: number | undefined;
}): string => {
    if (!amount || rate === undefined) {
        return '';
    }

    return toFiatCurrency({ amount, rate })?.toFixed(FIAT_DISPLAY_DECIMALS) ?? '';
};

/**
 * Crypto → fiat for a Max amount. Rounds **down** (unlike the half-up `getYieldFiatInputValue`) so
 * the shown value, if re-entered in fiat mode, never converts back above the balance — which would
 * otherwise trip a false "insufficient funds" on the exact max.
 */
export const getYieldMaxFiatInputValue = ({
    amount,
    rate,
}: {
    amount: string;
    rate: number | undefined;
}): string => {
    if (!amount || rate === undefined) {
        return '';
    }

    return (
        toFiatCurrency({ amount, rate })?.toFixed(FIAT_DISPLAY_DECIMALS, BigNumber.ROUND_DOWN) ?? ''
    );
};

/** Fiat → crypto (the source of truth). Empty string when the fiat is empty or no rate is available. */
export const getYieldCryptoInputValue = ({
    fiat,
    rate,
    decimals,
}: {
    fiat: string;
    rate: number | undefined;
    decimals: number;
}): string => {
    if (!fiat || rate === undefined) {
        return '';
    }

    // Trim trailing zeros so a round conversion shows "2" instead of "2.000000000000000000"
    // (which visually blows out the input). `decimalPlaces` keeps full token precision and
    // `toFixed()` (no arg) avoids the exponential notation the number input can't parse.
    return (
        fromBaseCurrencyToCryptoUnit({ fiatAmount: fiat, rate })
            ?.decimalPlaces(decimals)
            .toFixed() ?? ''
    );
};

export type YieldFlowStepView = {
    state: StepListItemState;
    /**
     * 1-based position within the flow's step list. Steps that are not list items of
     * the flow get index 0 — they are never rendered in the StepList.
     */
    indicator: { index: number; total: number };
};

/** `listSteps` are the steps rendered as list items; they default to the flow's sequence without 'complete'. */
export const getYieldFlowSteps = (
    sequence: readonly YieldFlowStepId[],
    currentStep: YieldFlowStepId,
    listSteps?: readonly YieldFlowStepId[],
): Record<YieldFlowStepId, YieldFlowStepView> => {
    // The annotation widens the filter's inferred type predicate so indexOf below accepts any step id.
    const effectiveListSteps: readonly YieldFlowStepId[] =
        listSteps ?? sequence.filter(stepId => stepId !== 'complete');
    const currentStepIndex = sequence.indexOf(currentStep);

    const getStepState = (stepIndex: number): StepListItemState => {
        // Steps outside the flow's sequence are never rendered for it; report them as passed.
        if (stepIndex === -1) {
            return 'done';
        }

        if (stepIndex < currentStepIndex) {
            return 'done';
        }

        if (stepIndex === currentStepIndex) {
            return 'active';
        }

        return 'pending';
    };

    const getStepView = (stepId: YieldFlowStepId): YieldFlowStepView => ({
        state: getStepState(sequence.indexOf(stepId)),
        indicator: {
            index: effectiveListSteps.indexOf(stepId) + 1,
            total: effectiveListSteps.length,
        },
    });

    return {
        wrap: getStepView('wrap'),
        approve: getStepView('approve'),
        action: getStepView('action'),
        unwrap: getStepView('unwrap'),
        complete: getStepView('complete'),
    };
};
