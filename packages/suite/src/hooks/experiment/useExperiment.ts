import { useMemo } from 'react';

import { selectAnalyticsInstanceId } from '@suite-common/analytics';
import {
    ExperimentNameType,
    experiments,
    selectActiveExperimentGroup,
    selectExperimentById,
} from '@suite-common/message-system';

import { useSelector } from 'src/hooks/suite';

export const useExperiment = (id: ExperimentNameType) => {
    const experimentUuid = experiments[id];
    const instanceId = useSelector(selectAnalyticsInstanceId);
    const experiment = useSelector(selectExperimentById(experimentUuid));

    console.log('[active AB test]', experiment);

    const activeExperimentVariant = useMemo(
        () => selectActiveExperimentGroup({ instanceId, experiment }),
        [instanceId, experiment],
    );

    return {
        experiment,
        activeExperimentVariant,
    };
};
