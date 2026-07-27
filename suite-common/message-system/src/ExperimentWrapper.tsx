import { type ReactElement } from 'react';

import { type ExperimentId } from './messageSystemTypes';
import { useExperiment } from './useExperiment';

interface ExperimentWrapperProps {
    id: ExperimentId;
    components: Array<{
        variant: string;
        element: ReactElement;
    }>;
}

/**
 * @param components first item in components is default
 */
export const ExperimentWrapper = ({
    id,
    components,
}: ExperimentWrapperProps): ReactElement | null => {
    const { experiment, activeExperimentVariant } = useExperiment(id);
    const defaultComponent = components[0];

    if (!experiment || !activeExperimentVariant) {
        return defaultComponent?.element ?? null;
    }

    const activeComponent = components.find(
        component => component.variant === activeExperimentVariant.variant,
    );

    return activeComponent?.element ?? defaultComponent?.element ?? null;
};
