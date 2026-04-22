import { type ReactNode } from 'react';

import { Translation } from '@suite-native/intl';

import { EarnModalStepIndicator } from './EarnModalStepIndicator';

export const StakingDetailModalStep = {
    TransactionConfirmed: 'TransactionConfirmed',
    InProgress: 'InProgress',
    Completed: 'Completed',
} as const;

export type StakingDetailModalStep =
    (typeof StakingDetailModalStep)[keyof typeof StakingDetailModalStep];

const stepOrder = [
    StakingDetailModalStep.TransactionConfirmed,
    StakingDetailModalStep.InProgress,
    StakingDetailModalStep.Completed,
] as const;

type StakingManagementModalStepIndicatorProps = {
    currentStep: StakingDetailModalStep;
    inProgressLabel: ReactNode;
    completedLabel: ReactNode;
};

export const StakingManagementModalStepIndicator = ({
    currentStep,
    inProgressLabel,
    completedLabel,
}: StakingManagementModalStepIndicatorProps) => {
    const idx = stepOrder.indexOf(currentStep);
    if (idx === -1) {
        console.warn(
            'StakingManagementModalStepIndicator: unexpected currentStep',
            currentStep,
            'not found in stepOrder',
            stepOrder,
        );
    }
    const currentIndex = Math.max(0, idx);
    const steps = [
        {
            id: StakingDetailModalStep.TransactionConfirmed,
            label: (
                <Translation id="earn.stakingManagementScreen.pendingItemModal.stepTransactionConfirmed" />
            ),
        },
        {
            id: StakingDetailModalStep.InProgress,
            label: inProgressLabel,
        },
        {
            id: StakingDetailModalStep.Completed,
            label: completedLabel,
        },
    ];

    return <EarnModalStepIndicator currentStepIndex={currentIndex} steps={steps} />;
};
