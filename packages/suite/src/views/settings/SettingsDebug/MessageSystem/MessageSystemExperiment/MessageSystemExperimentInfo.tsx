import { useEffect, useState } from 'react';

import {
    type ExperimentsItemType,
    buildExperimentGroupRanges,
    getInclusionFromInstanceId,
    messageSystemActions,
} from '@suite-common/message-system';
import { Button, Column, Icon, InfoItem, Range } from '@trezor/components';
import { useDebounce } from '@trezor/react-utils';
import { spacings } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';

type MessageSystemExperimentInfoProps = {
    experiment: ExperimentsItemType;
    assignedGroup?: ExperimentsItemType['groups'][number];
    instanceId?: string;
    isActive: boolean;
    inclusionOverride?: number;
};

export const MessageSystemExperimentInfo = ({
    experiment,
    assignedGroup,
    isActive,
    instanceId,
    inclusionOverride,
}: MessageSystemExperimentInfoProps) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const [localInclusion, setLocalInclusion] = useState<number | null>(null);

    const inclusion = instanceId ? getInclusionFromInstanceId(instanceId, experiment.id) : 0;

    const ranges = buildExperimentGroupRanges(experiment.groups);

    useEffect(() => {
        setLocalInclusion(inclusionOverride != null ? inclusionOverride : inclusion);
    }, [inclusion, inclusionOverride]);

    const onInclusionChange = (value: number) => {
        setLocalInclusion(value);

        debounce(() => {
            dispatch(
                messageSystemActions.setExperimentInclusionOverride({
                    id: experiment.id,
                    inclusion: value,
                }),
            );
        });
    };

    const onResetInclusion = () => {
        setLocalInclusion(inclusion);
        dispatch(messageSystemActions.clearExperimentInclusionOverride(experiment.id));
    };

    return (
        <Column gap={spacings.xs}>
            <InfoItem label="Active" iconName="info" direction="row">
                <Icon name="circleFilled" intent={isActive ? 'brand' : 'critical'} />
            </InfoItem>

            <InfoItem label="Assigned group" iconName="users" direction="row">
                {assignedGroup ? assignedGroup.variant : 'N/A'}
            </InfoItem>

            <InfoItem label="Inclusion" iconName="crosshair" direction="row">
                {localInclusion !== null ? localInclusion : 'N/A'}
            </InfoItem>

            <Range
                mode="segments"
                value={localInclusion ?? 0}
                labels={ranges.map(range => ({
                    max: range.range.end,
                    value: range.group.variant,
                }))}
                min={0}
                max={99}
                onChange={value => onInclusionChange(value.target.valueAsNumber)}
            />

            <Column alignItems="flex-end">
                <Button
                    size="small"
                    intent="warning"
                    iconLeft="arrowCounterClockwise"
                    isDisabled={localInclusion === inclusion}
                    onClick={onResetInclusion}
                >
                    Reset inclusion
                </Button>
            </Column>
        </Column>
    );
};
