import {
    type YieldFlowDisplayToken,
    type YieldFlowStepId,
    type YieldFlowToken,
    type YieldWithdrawFlowType,
    getConvertedOutputTokenBalanceToInputTokenAmount,
} from '@suite-common/wallet-core';
import type { StepListItemState } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

export { getYieldApprovalAction, type YieldApprovalAction } from '@suite-common/wallet-core';

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
