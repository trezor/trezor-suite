import { ReactElement } from 'react';

import { useExperiment, ExperimentId } from '@suite-common/message-system';

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
    const areComponentsEmpty = !components.length;

    if (areComponentsEmpty) return null;

    const defaultComponent = components[0];
    const experimentOrVariantNotFound = !experiment || !activeExperimentVariant;
    const experimentAndComponentsMismatch = experiment?.groups.length !== components.length;

    if (experimentOrVariantNotFound || experimentAndComponentsMismatch) {
        return defaultComponent.element;
    }

    const activeComponent = components.find(
        component => component.variant === activeExperimentVariant.variant,
    );

    return activeComponent?.element ?? defaultComponent.element;
};
