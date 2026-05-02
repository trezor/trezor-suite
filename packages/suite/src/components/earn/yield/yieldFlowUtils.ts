import { tokenSupportsIncreasingAllowance } from '@suite-common/trading';
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

type GetYieldApprovalActionParams = {
    liveAmount: string;
    allowanceAmount?: string | null;
    isModifyMode: boolean;
    isRevokeRequired: boolean;
    tokenContractAddress?: string | null;
};

export type YieldApprovalAction = 'approve' | 'increase' | 'revoke';

export const isAmountGreaterThan = ({ amount, threshold }: AmountComparisonParams): boolean =>
    !!amount && !!threshold && new BigNumber(amount).gt(threshold);

export const getYieldApprovalAction = ({
    liveAmount,
    allowanceAmount,
    isModifyMode,
    isRevokeRequired,
    tokenContractAddress,
}: GetYieldApprovalActionParams): YieldApprovalAction => {
    if (!isModifyMode) {
        return 'approve';
    }

    const allowanceAmountValue = new BigNumber(allowanceAmount || '0');
    const liveAmountValue = new BigNumber(liveAmount || '0');
    const hasAllowanceAmount = !!allowanceAmount && !allowanceAmountValue.isZero();
    const isAmountChanged = hasAllowanceAmount && !liveAmountValue.eq(allowanceAmountValue);
    const isIncreasing = hasAllowanceAmount && liveAmountValue.gt(allowanceAmountValue);
    const needsZeroApprovalReset =
        !!tokenContractAddress && !tokenSupportsIncreasingAllowance(tokenContractAddress);

    if (isRevokeRequired || (isAmountChanged && needsZeroApprovalReset)) {
        return 'revoke';
    }

    if (isIncreasing) {
        return 'increase';
    }

    return 'approve';
};

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
