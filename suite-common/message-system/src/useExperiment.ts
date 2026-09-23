import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAnalyticsInstanceId } from '@suite-common/analytics-redux';

import { getActiveExperimentGroup, getExperimentGroupByInclusion } from './experimentUtils';
import {
    selectExperimentById,
    selectExperimentInclusionOverrideById,
} from './messageSystemSelectors';
import type { ExperimentId } from './messageSystemTypes';

type UseIsExperimentVariantActiveParams = {
    experimentId: ExperimentId;
    variant: string;
};

export const useExperiment = (experimentId: ExperimentId) => {
    const instanceId = useSelector(selectAnalyticsInstanceId);
    const experiment = useSelector(selectExperimentById(experimentId));
    const inclusionOverride = useSelector(selectExperimentInclusionOverrideById(experimentId));
    const activeExperimentVariant = useMemo(
        () =>
            experiment && inclusionOverride != null
                ? getExperimentGroupByInclusion({
                      groups: experiment.groups,
                      inclusion: inclusionOverride,
                  })
                : getActiveExperimentGroup({ instanceId, experiment }),
        [instanceId, experiment, inclusionOverride],
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
