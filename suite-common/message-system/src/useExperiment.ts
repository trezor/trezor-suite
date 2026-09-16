import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAnalyticsInstanceId } from '@suite-common/analytics-redux';

import { getActiveExperimentGroup, getExperimentGroupByInclusion } from './experimentUtils';
import {
    selectExperimentById,
    selectExperimentInclusionOverrideById,
    selectExperimentVariantOverrideById,
} from './messageSystemSelectors';
import type { ExperimentId } from './messageSystemTypes';

export const useExperiment = (experimentId: ExperimentId) => {
    const instanceId = useSelector(selectAnalyticsInstanceId);
    const experiment = useSelector(selectExperimentById(experimentId));
    const inclusionOverride = useSelector(selectExperimentInclusionOverrideById(experimentId));
    const variantOverride = useSelector(selectExperimentVariantOverrideById(experimentId));
    const activeExperimentVariant = useMemo(() => {
        if (!experiment) return undefined;

        // A group the config gives no share of is unreachable by inclusion, so naming the
        // variant is the only way to try a feature that is not being rolled out yet.
        if (variantOverride != null) {
            return experiment.groups.find(group => group.variant === variantOverride);
        }

        if (inclusionOverride != null) {
            return getExperimentGroupByInclusion({
                groups: experiment.groups,
                inclusion: inclusionOverride,
            });
        }

        return getActiveExperimentGroup({ instanceId, experiment });
    }, [instanceId, experiment, inclusionOverride, variantOverride]);

    return {
        experiment,
        activeExperimentVariant,
    };
};
