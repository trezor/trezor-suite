import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAnalyticsInstanceId } from '@suite-common/analytics-redux';

import { getActiveExperimentGroup, getExperimentGroupByInclusion } from './experimentUtils';
import {
    selectExperimentById,
    selectExperimentInclusionOverrideById,
} from './messageSystemSelectors';
import type { ExperimentId, MessageSystemRootState } from './messageSystemTypes';

export const useExperiment = (experimentId: ExperimentId) => {
    const instanceId = useSelector(selectAnalyticsInstanceId);
    const experiment = useSelector((state: MessageSystemRootState) =>
        selectExperimentById(state, experimentId),
    );
    const inclusionOverride = useSelector((state: MessageSystemRootState) =>
        selectExperimentInclusionOverrideById(state, experimentId),
    );
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
