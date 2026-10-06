import { useSelector } from 'react-redux';

import { selectAnalyticsInstanceId } from '@suite-common/analytics-redux';
import { useServices } from '@suite-common/dependency-injection';
import {
    EXPERIMENT_MAP,
    type ExperimentId,
    type MessageSystemRootState,
    buildExperimentGroupRanges,
    getExperimentGroupByInclusion,
    getInclusionFromInstanceId,
    messageSystemActions,
    selectAllExperimentInclusionOverrides,
    selectIsExperimentValid,
} from '@suite-common/message-system';
import { injectDispatch } from '@suite-common/redux-utils';
import { type Experiments, type ExperimentsItem } from '@suite-common/suite-types';
import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';

import { MessageSystemExperimentInclusion } from './MessageSystemExperimentInclusion';

const formatRange = (start: number, end: number) => (start === end ? '∅' : `[${start}, ${end})`);

type ExperimentGroupRangesProps = {
    groups: ExperimentsItem['groups'];
};

const ExperimentGroupRanges = ({ groups }: ExperimentGroupRangesProps) => (
    <VStack spacing="sp2">
        <Text variant="body-sm-strong">Groups:</Text>
        {buildExperimentGroupRanges(groups).map(({ group, range }) => (
            <Text key={group.variant} variant="body-xs">
                {group.variant} ({group.percentage} %) {formatRange(range.start, range.end)}
            </Text>
        ))}
    </VStack>
);

type MessageSystemExperimentItemProps = {
    experimentWithConditions: Experiments;
    isManuallyAdded: boolean;
};

export const MessageSystemExperimentItem = ({
    experimentWithConditions,
    isManuallyAdded,
}: MessageSystemExperimentItemProps) => {
    const { experiment, conditions } = experimentWithConditions;
    const experimentId = experiment.id as ExperimentId;

    const isActive = useSelector((state: MessageSystemRootState) =>
        selectIsExperimentValid(state, experimentId),
    );
    const inclusionOverride = useSelector(selectAllExperimentInclusionOverrides)?.[experimentId];
    const instanceId = useSelector(selectAnalyticsInstanceId);
    const { dispatch } = useServices(injectDispatch);
    const copyToClipboard = useCopyToClipboard();

    const experimentName = EXPERIMENT_MAP[experimentId] as string | undefined;
    const inclusion = instanceId ? getInclusionFromInstanceId(instanceId, experimentId) : undefined;
    const effectiveInclusion = inclusionOverride ?? inclusion;
    const assignedGroup =
        effectiveInclusion !== undefined
            ? getExperimentGroupByInclusion({
                  groups: experiment.groups,
                  inclusion: effectiveInclusion,
              })
            : undefined;

    return (
        <Card>
            <VStack spacing="sp8">
                <Text variant="body-sm-strong" selectable>
                    {experiment.id}
                </Text>
                <Text variant="body-xs">Name: {experimentName ?? 'Unknown experiment'}</Text>
                <Text variant="body-xs">Active: {isActive ? 'yes' : 'no'}</Text>
                <ExperimentGroupRanges groups={experiment.groups} />
                <MessageSystemExperimentInclusion
                    experimentId={experimentId}
                    groups={experiment.groups}
                    assignedVariant={assignedGroup?.variant}
                    inclusion={effectiveInclusion}
                    isOverridden={inclusionOverride !== undefined}
                />
                <Text variant="body-xs">{JSON.stringify(conditions, null, 2)}</Text>
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    onPress={() =>
                        copyToClipboard(JSON.stringify({ conditions, experiment }, null, 2))
                    }
                >
                    Copy to clipboard
                </Button>
                {isManuallyAdded && (
                    <Button
                        intent="critical"
                        priority="secondary"
                        size="medium"
                        onPress={() =>
                            dispatch(messageSystemActions.removeExperiment(experiment.id))
                        }
                    >
                        Remove
                    </Button>
                )}
            </VStack>
        </Card>
    );
};
