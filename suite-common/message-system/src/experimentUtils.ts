import { getIntegerInRangeFromString } from '@trezor/utils';

import { type ExperimentId, type ExperimentsItemType } from './messageSystemTypes';

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

    return getIntegerInRangeFromString(combinedId, 100);
};

export function buildExperimentGroupRanges(groups: ExperimentsGroupsType) {
    let cursor = 0;

    return groups.map(group => {
        const start = cursor;
        const end = cursor + group.percentage;
        cursor = end;

        return { group, range: { start, end } };
    });
}

export const getExperimentGroupByInclusion = ({
    groups,
    inclusion,
}: ExperimentGetGroupByInclusion): ExperimentsGroupType | undefined => {
    if (inclusion < 0 || inclusion > 99) throw new Error('inclusion must be in [0, 99]');

    const extendedExperiment = buildExperimentGroupRanges(groups);

    return extendedExperiment.find(
        group => group.range.start <= inclusion && inclusion < group.range.end,
    )?.group;
};

export const getActiveExperimentGroup = ({
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

export const formatExperimentVariantsForAnalytics = (
    experimentVariants: Array<{ name: keyof typeof ExperimentId; variant: string }>,
): string[] => experimentVariants.map(({ name, variant }) => `${name}:${variant}`);
