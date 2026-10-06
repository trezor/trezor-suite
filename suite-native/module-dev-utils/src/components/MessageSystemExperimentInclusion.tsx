import { useEffect, useState } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import {
    type ExperimentId,
    buildExperimentGroupRanges,
    messageSystemActions,
} from '@suite-common/message-system';
import { injectDispatch } from '@suite-common/redux-utils';
import { type ExperimentsItem } from '@suite-common/suite-types';
import { Button, Input, SegmentedControl, Text, VStack } from '@suite-native/atoms';

const MIN_INCLUSION = 0;
const MAX_INCLUSION = 99;

const parseInclusion = (text: string) => {
    const value = Number(text);

    return text !== '' &&
        Number.isInteger(value) &&
        value >= MIN_INCLUSION &&
        value <= MAX_INCLUSION
        ? value
        : null;
};

type MessageSystemExperimentInclusionProps = {
    experimentId: ExperimentId;
    groups: ExperimentsItem['groups'];
    assignedVariant?: string;
    inclusion?: number;
    isOverridden: boolean;
};

export const MessageSystemExperimentInclusion = ({
    experimentId,
    groups,
    assignedVariant,
    inclusion,
    isOverridden,
}: MessageSystemExperimentInclusionProps) => {
    const { dispatch } = useServices(injectDispatch);

    const [inclusionText, setInclusionText] = useState(String(inclusion ?? ''));

    useEffect(() => {
        setInclusionText(String(inclusion ?? ''));
    }, [inclusion]);

    const selectableRanges = buildExperimentGroupRanges(groups).filter(
        ({ range }) => range.end > range.start,
    );

    const setInclusionOverride = (value: number) => {
        dispatch(
            messageSystemActions.setExperimentInclusionOverride({
                id: experimentId,
                inclusion: value,
            }),
        );
    };

    const handleVariantChange = (variant: string) => {
        if (variant === assignedVariant) return;

        const selectedRange = selectableRanges.find(({ group }) => group.variant === variant);

        if (selectedRange) {
            setInclusionOverride(selectedRange.range.start);
        }
    };

    const handleInclusionTextChange = (text: string) => {
        setInclusionText(text);

        const value = parseInclusion(text);

        if (value !== null) {
            setInclusionOverride(value);
        }
    };

    const handleResetInclusion = () => {
        dispatch(messageSystemActions.clearExperimentInclusionOverride(experimentId));
    };

    return (
        <VStack spacing="sp8">
            <Text variant="body-xs">Assigned group: {assignedVariant ?? 'N/A'}</Text>
            {assignedVariant && (
                <SegmentedControl
                    options={selectableRanges.map(({ group }) => ({
                        label: group.variant,
                        value: group.variant,
                    }))}
                    selectedValue={assignedVariant}
                    onValueChange={handleVariantChange}
                />
            )}
            <Input
                label={`Inclusion (${MIN_INCLUSION}-${MAX_INCLUSION})`}
                value={inclusionText}
                onChangeText={handleInclusionTextChange}
                keyboardType="number-pad"
                hasError={inclusionText !== '' && parseInclusion(inclusionText) === null}
            />
            <Button
                intent="warning"
                priority="secondary"
                size="medium"
                isDisabled={!isOverridden}
                onPress={handleResetInclusion}
            >
                Reset inclusion
            </Button>
        </VStack>
    );
};
