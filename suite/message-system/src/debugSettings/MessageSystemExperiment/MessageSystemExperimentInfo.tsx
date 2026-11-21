import { useEffect, useState } from 'react';

import {
    type ExperimentsItemType,
    buildExperimentGroupRanges,
    getInclusionFromInstanceId,
    messageSystemActions,
} from '@suite-common/message-system';
import { Button, Column, Icon, InfoItem, Range, SelectBar } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import {
    ArrowCounterClockwiseIcon,
    CircleFilledIcon,
    CrosshairIcon,
    InfoIcon,
    UsersIcon,
} from '@trezor/icons';
import { useDebounce } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

type MessageSystemExperimentInfoProps = {
    experiment: ExperimentsItemType;
    assignedGroup?: ExperimentsItemType['groups'][number];
    instanceId?: string;
    isActive: boolean;
    inclusionOverride?: number;
    variantOverride?: string;
};

export const MessageSystemExperimentInfo = ({
    experiment,
    assignedGroup,
    isActive,
    instanceId,
    inclusionOverride,
    variantOverride,
}: MessageSystemExperimentInfoProps) => {
    const { dispatch } = useServices(injectDispatch);
    const debounce = useDebounce();
    const [localInclusion, setLocalInclusion] = useState<number | null>(null);

    const inclusion = instanceId ? getInclusionFromInstanceId(instanceId, experiment.id) : 0;

    const ranges = buildExperimentGroupRanges(experiment.groups);
    const isVariantForced =
        variantOverride !== undefined && assignedGroup?.variant === variantOverride;

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

    const onVariantChange = (variant: string) => {
        dispatch(messageSystemActions.setExperimentVariantOverride({ id: experiment.id, variant }));
    };

    const onResetOverride = () => {
        setLocalInclusion(inclusion);
        dispatch(messageSystemActions.clearExperimentInclusionOverride(experiment.id));
        dispatch(messageSystemActions.clearExperimentVariantOverride(experiment.id));
    };

    return (
        <Column gap={8}>
            <InfoItem label="Active" icon={InfoIcon} direction="row">
                <Icon as={CircleFilledIcon} intent={isActive ? 'brand' : 'critical'} />
            </InfoItem>

            <InfoItem label="Assigned group" icon={UsersIcon} direction="row">
                {assignedGroup ? assignedGroup.variant : 'N/A'}
                {isVariantForced && ' (forced)'}
            </InfoItem>

            <SelectBar
                size="small"
                isFullWidth
                options={experiment.groups.map(({ variant }) => ({
                    label: variant,
                    value: variant,
                }))}
                selectedOption={assignedGroup?.variant}
                onChange={onVariantChange}
            />

            <InfoItem label="Inclusion" icon={CrosshairIcon} direction="row">
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
                    iconLeft={ArrowCounterClockwiseIcon}
                    isDisabled={localInclusion === inclusion && variantOverride === undefined}
                    onClick={onResetOverride}
                >
                    Reset override
                </Button>
            </Column>
        </Column>
    );
};
