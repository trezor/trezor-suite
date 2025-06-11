import { createHash } from 'crypto';

import { Range } from '@trezor/type-utils';

import { ExperimentId, ExperimentsItemType } from './messageSystemTypes';

type ExperimentCategoriesProps = {
    experiment: ExperimentsItemType | undefined;
    instanceId: string | undefined;
};

type ExperimentsGroupsType = ExperimentsItemType['groups'];
type ExperimentsGroupType = ExperimentsGroupsType[number];

type ExperimentGetGroupByInclusion = {
    groups: ExperimentsGroupsType;
    inclusion: Range<0, 99>;
};

function assertIsInRange<Min extends number, Max extends number>(
    value: number,
    min: Min,
    max: Max,
): asserts value is Range<Min, Max> {
    if (value < min || value > max) {
        throw new Error(`Value ${value} is out of range [${min}, ${max}].`);
    }
}

/**
 * @returns number between 0 and 99 generated from instanceId and experimentId
 */
export const getInclusionFromInstanceId = (
    instanceId: string,
    experimentId: ExperimentId,
): Range<0, 99> => {
    const combinedId = `${instanceId}-${experimentId}`;
    const hash = createHash('sha256').update(combinedId).digest('hex').slice(0, 8);

    const res = parseInt(hash, 16) % 100;
    assertIsInRange(res, 0, 99);

    return res;
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
