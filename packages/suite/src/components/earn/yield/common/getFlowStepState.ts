import { BulletListItemState } from '@trezor/components';

export const getFlowStepState = (
    currentStepIndex: number,
    stepIndex: number,
): BulletListItemState => {
    if (stepIndex < currentStepIndex) {
        return 'done';
    }

    if (stepIndex === currentStepIndex) {
        return 'active';
    }

    return 'pending';
};
