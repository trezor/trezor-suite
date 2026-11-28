import { useEffect, useState } from 'react';

import { type ExperimentId, messageSystemActions } from '@suite-common/message-system';
import { type ExperimentsItem } from '@suite-common/suite-types';
import { Button, Input, SegmentedControl, Text, VStack } from '@suite-native/atoms';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

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
    isVariantForced: boolean;
};

export const MessageSystemExperimentInclusion = ({
    experimentId,
    groups,
    assignedVariant,
    inclusion,
    isOverridden,
    isVariantForced,
}: MessageSystemExperimentInclusionProps) => {
    const { dispatch } = useServices(injectDispatch);

    const [inclusionText, setInclusionText] = useState(String(inclusion ?? ''));

    useEffect(() => {
        setInclusionText(String(inclusion ?? ''));
    }, [inclusion]);

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

        dispatch(messageSystemActions.setExperimentVariantOverride({ id: experimentId, variant }));
    };

    const handleInclusionTextChange = (text: string) => {
        setInclusionText(text);

        const value = parseInclusion(text);

        if (value !== null) {
            setInclusionOverride(value);
        }
    };

    const handleResetOverride = () => {
        dispatch(messageSystemActions.clearExperimentInclusionOverride(experimentId));
        dispatch(messageSystemActions.clearExperimentVariantOverride(experimentId));
    };

    return (
        <VStack spacing="sp8">
            <Text variant="body-xs">
                Assigned group: {assignedVariant ?? 'N/A'}
                {isVariantForced && ' (forced)'}
            </Text>
            {assignedVariant && (
                <SegmentedControl
                    options={groups.map(({ variant }) => ({ label: variant, value: variant }))}
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
                onPress={handleResetOverride}
            >
                Reset override
            </Button>
        </VStack>
    );
};
