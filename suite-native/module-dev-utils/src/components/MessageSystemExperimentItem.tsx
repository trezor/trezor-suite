import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
    EXPERIMENT_MAP,
    type ExperimentsItemType,
    buildExperimentGroupRanges,
    getActiveExperimentGroup,
    getExperimentGroupByInclusion,
    getInclusionFromInstanceId,
    messageSystemActions,
} from '@suite-common/message-system';
import { type Experiments } from '@suite-common/suite-types';
import { Button, Card, Input, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';

type MessageSystemExperimentItemProps = {
    experimentsItem: Experiments;
    isActive: boolean;
    isManuallyAdded: boolean;
    instanceId?: string;
    inclusionOverride?: number;
    onRemove: (id: string) => void;
};

const formatRange = (start: number, end: number) => (start === end ? '∅' : `[${start}, ${end})`);

const clampInclusion = (value: number) => Math.min(99, Math.max(0, value));

export const MessageSystemExperimentItem = ({
    experimentsItem,
    isActive,
    isManuallyAdded,
    instanceId,
    inclusionOverride,
    onRemove,
}: MessageSystemExperimentItemProps) => {
    const dispatch = useDispatch();
    const copyToClipboard = useCopyToClipboard();

    const { conditions, experiment: rawExperiment } = experimentsItem;
    const experiment = rawExperiment as ExperimentsItemType;
    const experimentName =
        experiment.id in EXPERIMENT_MAP ? EXPERIMENT_MAP[experiment.id] : undefined;

    const inclusion = instanceId ? getInclusionFromInstanceId(instanceId, experiment.id) : 0;
    const effectiveInclusion = inclusionOverride ?? inclusion;
    const assignedGroup =
        inclusionOverride != undefined
            ? getExperimentGroupByInclusion({
                  groups: experiment.groups,
                  inclusion: inclusionOverride,
              })
            : getActiveExperimentGroup({ experiment, instanceId });
    const ranges = buildExperimentGroupRanges(experiment.groups);

    const [inclusionText, setInclusionText] = useState<string>(String(effectiveInclusion));

    useEffect(() => {
        setInclusionText(String(effectiveInclusion));
    }, [effectiveInclusion]);

    const handleInclusionSubmit = () => {
        const parsed = Number.parseInt(inclusionText, 10);
        if (Number.isNaN(parsed)) {
            setInclusionText(String(effectiveInclusion));

            return;
        }
        const clamped = clampInclusion(parsed);
        setInclusionText(String(clamped));
        dispatch(
            messageSystemActions.setExperimentInclusionOverride({
                id: experiment.id,
                inclusion: clamped,
            }),
        );
    };

    const handleResetInclusion = () => {
        dispatch(messageSystemActions.clearExperimentInclusionOverride(experiment.id));
    };

    return (
        <Card>
            <VStack spacing="sp8">
                <Text variant="body-sm-strong">{experiment.id}</Text>
                {experimentName ? (
                    <Text variant="body-xs">Name: {experimentName}</Text>
                ) : (
                    <Text variant="body-xs" color="contentWarning">
                        Unknown experiment
                    </Text>
                )}
                <VStack spacing="sp2">
                    <Text variant="body-xs">Active: {isActive ? 'yes' : 'no'}</Text>
                    <Text variant="body-xs">Source: {isManuallyAdded ? 'in-app' : 'file'}</Text>
                    <Text variant="body-xs">Assigned group: {assignedGroup?.variant ?? 'N/A'}</Text>
                    <Text variant="body-xs">
                        Inclusion: {effectiveInclusion}
                        {inclusionOverride != undefined ? ' (override)' : ''}
                    </Text>
                </VStack>
                <VStack spacing="sp2">
                    <Text variant="body-xs">Groups:</Text>
                    {ranges.map(({ group, range }, index) => {
                        const isAssigned =
                            group.variant === assignedGroup?.variant &&
                            group.percentage === assignedGroup?.percentage;

                        return (
                            <Text
                                key={`${group.variant}-${index}`}
                                variant="body-xs"
                                color={isAssigned ? 'contentBrand' : 'contentPrimary'}
                            >
                                {group.variant} ({group.percentage} %){' '}
                                {formatRange(range.start, range.end)}
                            </Text>
                        );
                    })}
                </VStack>
                <Text variant="body-xs">{JSON.stringify(conditions, null, 2)}</Text>
                <Input
                    label="Inclusion override (0-99)"
                    value={inclusionText}
                    onChangeText={setInclusionText}
                    onEndEditing={handleInclusionSubmit}
                    keyboardType="number-pad"
                />
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    isDisabled={inclusionOverride == undefined}
                    onPress={handleResetInclusion}
                >
                    Reset inclusion
                </Button>
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    onPress={() =>
                        copyToClipboard(
                            JSON.stringify({ conditions, experiment: rawExperiment }, null, 2),
                        )
                    }
                >
                    Copy
                </Button>
                {isManuallyAdded && (
                    <Button
                        intent="critical"
                        priority="secondary"
                        size="medium"
                        onPress={() => onRemove(experiment.id)}
                    >
                        Remove
                    </Button>
                )}
            </VStack>
        </Card>
    );
};
