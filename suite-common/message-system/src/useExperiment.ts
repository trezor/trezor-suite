import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAnalyticsInstanceId } from '@suite-common/analytics';

import { getActiveExperimentGroup } from './experimentUtils';
import { selectExperimentByKey } from './messageSystemSelectors';
import { ExperimentKey } from './messageSystemTypes';

export const useExperiment = (experimentKey: ExperimentKey) => {
    const instanceId = useSelector(selectAnalyticsInstanceId);
    const experiment = useSelector(selectExperimentByKey(experimentKey));
    const activeExperimentVariant = useMemo(
        () => getActiveExperimentGroup({ instanceId, experiment }),
        [instanceId, experiment],
    );

    return {
        experiment,
        activeExperimentVariant,
    };
};
