import { useState } from 'react';

import type { SpinnerVariant } from '../types';

export const spinnerStages = ['intro', 'spinning', 'settled'] as const;
export type SpinnerStage = (typeof spinnerStages)[number];

type UseSpinnerStageParams = {
    variant: SpinnerVariant;
    hasStartAnimation?: boolean;
};

type UseSpinnerStageResult = {
    stage: SpinnerStage;
    handleIntroEnd: () => void;
    handleRotationEnd: () => void;
};

export const useSpinnerStage = ({
    variant,
    hasStartAnimation,
}: UseSpinnerStageParams): UseSpinnerStageResult => {
    const [hasIntroPlayed, setHasIntroPlayed] = useState(!hasStartAnimation);
    const [hasCompletedRotation, setHasCompletedRotation] = useState(false);

    // The result only takes over after a full revolution, so a spinner that resolves immediately
    // still reads as having spun instead of flashing straight to a checkmark.
    const getStage = (): SpinnerStage => {
        if (variant !== 'loading' && hasCompletedRotation) {
            return 'settled';
        }

        return hasIntroPlayed ? 'spinning' : 'intro';
    };

    const handleIntroEnd = () => {
        setHasIntroPlayed(true);
    };

    const handleRotationEnd = () => {
        if (!hasCompletedRotation) {
            setHasCompletedRotation(true);
        }
    };

    return { stage: getStage(), handleIntroEnd, handleRotationEnd };
};
