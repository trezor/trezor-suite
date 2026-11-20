import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAnalyticsInstanceId } from '@suite-common/analytics-redux';

import { resolveExperimentGroup } from './experimentUtils';
import {
    selectExperimentById,
    selectExperimentInclusionOverrideById,
    selectExperimentVariantOverrideById,
} from './messageSystemSelectors';
import type { ExperimentId, MessageSystemRootState } from './messageSystemTypes';

type UseIsExperimentVariantActiveParams = {
    experimentId: ExperimentId;
    variant: string;
};

export const useExperiment = (experimentId: ExperimentId) => {
    const instanceId = useSelector(selectAnalyticsInstanceId);
    const experiment = useSelector(selectExperimentById(experimentId));
    const inclusionOverride = useSelector(selectExperimentInclusionOverrideById(experimentId));
    const variantOverride = useSelector((state: MessageSystemRootState) =>
        selectExperimentVariantOverrideById(state, experimentId),
    );
    const activeExperimentVariant = useMemo(
        () =>
            resolveExperimentGroup({
                experiment,
                instanceId,
                variantOverride,
                inclusionOverride: inclusionOverride ?? undefined,
            }),
        [instanceId, experiment, variantOverride, inclusionOverride],
    );

    return {
        experiment,
        activeExperimentVariant,
    };
};

export const useIsExperimentVariantActive = ({
    experimentId,
    variant,
}: UseIsExperimentVariantActiveParams): boolean => {
    const { activeExperimentVariant } = useExperiment(experimentId);

    return activeExperimentVariant?.variant === variant;
};
