import { createHash } from 'crypto';

import { ExperimentId, ExperimentsItemType } from './messageSystemTypes';

type ExperimentCategoriesProps = {
    experiment: ExperimentsItemType | undefined;
    instanceId: string | undefined;
};

type ExperimentsGroupsType = ExperimentsItemType['groups'];
type ExperimentsGroupType = ExperimentsGroupsType[number];

type ExperimentGetGroupByInclusion = {
    groups: ExperimentsGroupsType;
    inclusion: number;
};

/**
 * @returns number between 0 and 99 generated from instanceId and experimentId
 */
export const getInclusionFromInstanceId = (instanceId: string, experimentId: ExperimentId) => {
    const combinedId = `${instanceId}-${experimentId}`;
    const hash = createHash('sha256').update(combinedId).digest('hex').slice(0, 8);

    return parseInt(hash, 16) % 100;
};

export const getExperimentGroupByInclusion = ({
    groups,
    inclusion,
}: ExperimentGetGroupByInclusion): ExperimentsGroupType | undefined => {
    let currentPercentage = 0;

    const extendedExperiment = groups.map(group => {
        const result = {
            group,
            range: [currentPercentage, currentPercentage + group.percentage - 1],
        };

        currentPercentage += group.percentage;

        return result;
    });

    return extendedExperiment.find(
        group => group.range[0] <= inclusion && group.range[1] >= inclusion,
    )?.group;
};

export const selectActiveExperimentGroup = ({
    experiment,
    instanceId,
}: ExperimentCategoriesProps): ExperimentsGroupType | undefined => {
    if (!instanceId || !experiment) return undefined;

    const inclusionFromInstanceId = getInclusionFromInstanceId(instanceId, experiment.id);
    const { groups } = experiment;

    const experimentRange = getExperimentGroupByInclusion({
        groups,
        inclusion: inclusionFromInstanceId,
    });

    return experimentRange;
};
