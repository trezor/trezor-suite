import { useMemo } from 'react';

import { useSelector } from './useSelector';
import { progressBarSteps, steps } from '../../config/onboarding/steps';
import { isStepUsed, selectIsStepUsedContext } from '../../utils/onboarding/steps';

/**
 * Returns progressBarSteps that have at least one currently relevant step
 * (for example Coin selection `step` and `progressBarStep` is hidden for BTC-only onboarding)
 * */
export const useOnboardingProgressBarStepsInPath = () => {
    const isStepUsedContext = useSelector(selectIsStepUsedContext);

    return useMemo(() => {
        const stepsInPath = steps.filter(step => isStepUsed(step, isStepUsedContext));

        return progressBarSteps.filter(progressBarStep =>
            stepsInPath.some(({ stepGroup }) => stepGroup === progressBarStep.key),
        );
    }, [isStepUsedContext]);
};
