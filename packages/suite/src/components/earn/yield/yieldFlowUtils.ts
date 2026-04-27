import { YIELD_FLOW_STEPS, type YieldFlowStepId } from '@suite-common/wallet-core';
import type { BulletListItemState } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

interface AmountComparisonParams {
    amount?: string;
    threshold?: string;
}

interface YieldModifyAmountInputParams {
    liveAmount?: string;
    actionAmount?: string | null;
    maxAmount: string;
}

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
