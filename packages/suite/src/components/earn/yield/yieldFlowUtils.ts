import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import {
    YIELD_FLOW_STEP_SEQUENCES,
    type YieldFlowStepId,
    type YieldFlowType,
} from '@suite-common/wallet-core';
import { getApyPercent } from '@suite-common/wallet-utils';
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

/**
 * Encodes per-component APY contributions as a single comma-separated string:
 * `SYMBOL_A,APY_A,SYMBOL_B,APY_B,…` sorted alphabetically by symbol. Each
 * component is emitted as-is — symbols repeating across components are not
 * merged. Returns an empty string when there are no usable components.
 */
export const getApyBreakdown = (
    components: YieldDtoV2['rewardRate']['components'] | undefined,
): string =>
    (components ?? [])
        .map(component => {
            if (!Number.isFinite(component.rate)) return null;
            const symbol = component.token?.symbol;
            if (!symbol) return null;
            const componentApy = getApyPercent(component.rate);

            return componentApy != null ? ([symbol, componentApy] as const) : null;
        })
        .filter((pair): pair is readonly [string, number] => pair !== null)
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([symbol, componentApy]) => [symbol, String(componentApy)])
        .join(',');

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
    flowType: YieldFlowType,
    currentStep: YieldFlowStepId,
    listSteps?: readonly YieldFlowStepId[],
): Record<YieldFlowStepId, YieldFlowStepView> => {
    // Both annotations widen the per-flow tuples (and the filter's inferred type predicate)
    // so indexOf below accepts any step id.
    const sequence: readonly YieldFlowStepId[] = YIELD_FLOW_STEP_SEQUENCES[flowType];
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
        approve: getStepView('approve'),
        action: getStepView('action'),
        complete: getStepView('complete'),
    };
};
