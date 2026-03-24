import { useCallback, useMemo, useState } from 'react';

import type { BulletListItemState } from '@trezor/components';

import { YIELD_FLOW_STEPS, type YieldFlowStepId } from '../common/types';

export type UseYieldFlowStepsResult = {
    currentStep: YieldFlowStepId;
    stepStates: Record<YieldFlowStepId, BulletListItemState>;
    goToNextStep: () => void;
    goToStep: (step: YieldFlowStepId) => void;
};

export const useYieldFlowSteps = (): UseYieldFlowStepsResult => {
    const [currentStep, setCurrentStep] = useState<YieldFlowStepId>(YIELD_FLOW_STEPS[0]);
    const currentStepIndex = YIELD_FLOW_STEPS.indexOf(currentStep);
    const stepStates = useMemo(
        () =>
            Object.fromEntries(
                YIELD_FLOW_STEPS.map((stepId, stepIndex) => {
                    let state: BulletListItemState = 'pending';

                    if (stepIndex < currentStepIndex) {
                        state = 'done';
                    } else if (stepIndex === currentStepIndex) {
                        state = 'active';
                    }

                    return [stepId, state];
                }),
            ) as Record<YieldFlowStepId, BulletListItemState>,
        [currentStepIndex],
    );

    const goToNextStep = useCallback(() => {
        setCurrentStep(
            current => YIELD_FLOW_STEPS[YIELD_FLOW_STEPS.indexOf(current) + 1] ?? current,
        );
    }, []);

    const goToStep = useCallback((step: YieldFlowStepId) => {
        setCurrentStep(step);
    }, []);

    return {
        currentStep,
        stepStates,
        goToNextStep,
        goToStep,
    };
};
