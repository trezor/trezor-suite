import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAnalyticsInstanceId } from '@suite-common/analytics';

import { getActiveExperimentGroup } from './experimentUtils';
import { selectExperimentById } from './messageSystemSelectors';
import { ExperimentId } from './messageSystemTypes';

export const useExperiment = (experimentId: ExperimentId) => {
    const instanceId = useSelector(selectAnalyticsInstanceId);
    const experiment = useSelector(selectExperimentById(experimentId));
    const activeExperimentVariant = useMemo(
        () => getActiveExperimentGroup({ instanceId, experiment }),
        [instanceId, experiment],
    );

    return {
        experiment,
        activeExperimentVariant,
    };
};
