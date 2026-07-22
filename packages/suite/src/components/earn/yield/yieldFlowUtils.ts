import { type YieldFlowStepId } from '@suite-common/wallet-core';
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
