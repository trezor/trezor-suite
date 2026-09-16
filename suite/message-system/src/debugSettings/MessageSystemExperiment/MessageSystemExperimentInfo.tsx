import { useEffect, useState } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import {
    type ExperimentsItemType,
    buildExperimentGroupRanges,
    getInclusionFromInstanceId,
    messageSystemActions,
} from '@suite-common/message-system';
import { selectDispatch } from '@suite-common/redux-utils';
import { Button, Column, Icon, InfoItem, Range, SelectBar } from '@trezor/components';
import {
    ArrowCounterClockwiseIcon,
    CircleFilledIcon,
    CrosshairIcon,
    InfoIcon,
    UsersIcon,
} from '@trezor/icons';
import { useDebounce } from '@trezor/react-utils';
type MessageSystemExperimentInfoProps = {
    experiment: ExperimentsItemType;
    assignedGroup?: ExperimentsItemType['groups'][number];
    instanceId?: string;
    isActive: boolean;
    inclusionOverride?: number;
    variantOverride?: string;
};

const NO_VARIANT_OVERRIDE = 'auto';

export const MessageSystemExperimentInfo = ({
    experiment,
    assignedGroup,
    isActive,
    instanceId,
    inclusionOverride,
    variantOverride,
}: MessageSystemExperimentInfoProps) => {
    const { dispatch } = useServices(selectDispatch);
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

    const onVariantChange = (value: string) => {
        dispatch(
            value === NO_VARIANT_OVERRIDE
                ? messageSystemActions.clearExperimentVariantOverride(experiment.id)
                : messageSystemActions.setExperimentVariantOverride({
                      id: experiment.id,
                      variant: value,
                  }),
        );
    };

    return (
        <Column gap={8}>
            <InfoItem label="Active" icon={InfoIcon} direction="row">
                <Icon as={CircleFilledIcon} intent={isActive ? 'brand' : 'critical'} />
            </InfoItem>

            <InfoItem label="Assigned group" icon={UsersIcon} direction="row">
                {assignedGroup ? assignedGroup.variant : 'N/A'}
            </InfoItem>

            <InfoItem label="Inclusion" icon={CrosshairIcon} direction="row">
                {localInclusion !== null ? localInclusion : 'N/A'}
            </InfoItem>

            <InfoItem label="Force variant" icon={UsersIcon} direction="row">
                <SelectBar
                    size="small"
                    selectedOption={variantOverride ?? NO_VARIANT_OVERRIDE}
                    options={[
                        { label: 'Auto', value: NO_VARIANT_OVERRIDE },
                        ...experiment.groups.map(group => ({
                            label: group.variant,
                            value: group.variant,
                        })),
                    ]}
                    onChange={onVariantChange}
                />
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
                    isDisabled={localInclusion === inclusion}
                    onClick={onResetInclusion}
                >
                    Reset inclusion
                </Button>
            </Column>
        </Column>
    );
};
