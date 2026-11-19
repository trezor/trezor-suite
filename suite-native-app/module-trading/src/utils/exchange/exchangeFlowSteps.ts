import { type ExchangeFlowApprovalStatus, type ExchangeFlowStep } from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

export type ExchangeApprovalStepVariant = 'basic' | 'afterRevoke' | 'increase';

export type ExchangeFlowNextStep = {
    step: ExchangeFlowStep;
    stepNumber: number;
};

export type ExchangeFlowStepCards = {
    lastFinishedStep: ExchangeFlowStep | undefined;
    currentStep: ExchangeFlowStep;
    currentStepNumber: number;
    stepCount: number;
    nextSteps: ExchangeFlowNextStep[];
};

type ExchangeFlowSteps = [ExchangeFlowStep, ...ExchangeFlowStep[]];

type GetExchangeFlowStepCardsParams = {
    approvalStatus: ExchangeFlowApprovalStatus;
    currentStep: ExchangeFlowStep | undefined;
};

export const getExchangeFlowSteps = (
    approvalStatus: ExchangeFlowApprovalStatus,
): ExchangeFlowSteps => {
    switch (approvalStatus) {
        case 'needs_revoke':
            return ['revoke', 'approval', 'preview'];
        case 'needs_increase':
        case 'needs_approval':
            return ['approval', 'preview'];
        default:
            return exhaustive(approvalStatus);
    }
};

export const getExchangeApprovalStepVariant = (
    approvalStatus: ExchangeFlowApprovalStatus,
): ExchangeApprovalStepVariant => {
    switch (approvalStatus) {
        case 'needs_revoke':
            return 'afterRevoke';
        case 'needs_increase':
            return 'increase';
        case 'needs_approval':
            return 'basic';
        default:
            return exhaustive(approvalStatus);
    }
};

export const getExchangeFlowStepCards = ({
    approvalStatus,
    currentStep,
}: GetExchangeFlowStepCardsParams): ExchangeFlowStepCards => {
    const steps = getExchangeFlowSteps(approvalStatus);
    const [firstStep] = steps;
    // A step outside of this flow (e.g. revoke when no revoke is needed) falls back to the first one.
    const resolvedCurrentStep =
        currentStep && steps.includes(currentStep) ? currentStep : firstStep;
    const currentStepIndex = steps.indexOf(resolvedCurrentStep);

    return {
        lastFinishedStep: steps[currentStepIndex - 1],
        currentStep: resolvedCurrentStep,
        currentStepNumber: currentStepIndex + 1,
        stepCount: steps.length,
        nextSteps: steps.slice(currentStepIndex + 1).map((step, index) => ({
            step,
            stepNumber: currentStepIndex + index + 2,
        })),
    };
};
