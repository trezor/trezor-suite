import { type ReactNode } from 'react';
import { View } from 'react-native';

import { HStack, PressableOpacity, RoundedIcon, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type StepStatus = 'done' | 'skipped' | 'active' | 'pending';

export type EarnModalStep = {
    id: string;
    /** Marks a finished step the user chose to skip, e.g. an offered wrap they did not need. */
    isSkipped?: boolean;
    label: ReactNode;
    onEdit?: () => void;
};

type EarnModalStepIndicatorProps = {
    currentStepIndex: number;
    steps: EarnModalStep[];
};

const getStepStatus = (
    stepIndex: number,
    currentStepIndex: number,
    isSkipped: boolean,
): StepStatus => {
    if (stepIndex < currentStepIndex) {
        return isSkipped ? 'skipped' : 'done';
    }

    if (stepIndex === currentStepIndex) {
        return 'active';
    }

    return 'pending';
};

const circleStyle = prepareNativeStyle<{ status: StepStatus }>((utils, { status }) => ({
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    extend: [
        {
            condition: status === 'done',
            style: { backgroundColor: utils.colors.elementFillBrandBold },
        },
        {
            condition: status === 'skipped',
            style: { backgroundColor: utils.colors.elementFillNeutralBold },
        },
        {
            condition: status === 'active',
            style: {
                backgroundColor: utils.colors.elementFillBrandSofter,
            },
        },
    ],
}));

const innerDotStyle = prepareNativeStyle<{ status: StepStatus }>((utils, { status }) => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: utils.colors.elementFillNeutralSofter,
    extend: {
        condition: status === 'active',
        style: { backgroundColor: utils.colors.elementFillBrandBold },
    },
}));

const connectorStyle = prepareNativeStyle<{ isResolved: boolean }>((utils, { isResolved }) => ({
    width: 2,
    height: 24,
    marginLeft: 8,
    marginVertical: -2,
    backgroundColor: 'transparent',
    extend: {
        condition: isResolved,
        style: { backgroundColor: utils.colors.elementFillBrandBold },
    },
}));

const containerStyle = prepareNativeStyle(utils => ({
    marginVertical: utils.spacings.sp8,
}));

const stepStatusIcons: Partial<Record<StepStatus, ReactNode>> = {
    done: <Icon name="check" size="small" color="contentButtonBrandPrimary" />,
    skipped: <Icon name="arrowFatLinesRight" size="small" color="contentButtonBrandPrimary" />,
};

const StepRow = ({
    status,
    isEditable = false,
    children,
}: {
    status: StepStatus;
    isEditable?: boolean;
    children: ReactNode;
}) => {
    const { applyStyle } = useNativeStyles();
    const isActive = status === 'active';

    return (
        <HStack spacing="sp12" alignItems="center" justifyContent="space-between">
            <HStack spacing="sp12" alignItems="center" flexShrink={1}>
                <View style={applyStyle(circleStyle, { status })}>
                    {stepStatusIcons[status] ?? (
                        <View style={applyStyle(innerDotStyle, { status })} />
                    )}
                </View>
                <Text
                    variant={isActive ? 'body-sm-strong' : 'body-sm'}
                    color={isActive ? undefined : 'contentSecondary'}
                >
                    {children}
                </Text>
            </HStack>
            {isEditable && <RoundedIcon name="arrowLeft" intent="brand" size={24} />}
        </HStack>
    );
};

export const EarnModalStepIndicator = ({
    currentStepIndex,
    steps,
}: EarnModalStepIndicatorProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={applyStyle(containerStyle)}>
            {steps.map((step, index) => {
                const status = getStepStatus(index, currentStepIndex, !!step.isSkipped);
                const isLastStep = index === steps.length - 1;
                const isStepResolved = status === 'done' || status === 'skipped';
                const onEdit = isStepResolved ? step.onEdit : undefined;

                return (
                    <View key={step.id}>
                        {onEdit ? (
                            <PressableOpacity
                                onPress={onEdit}
                                testID={`@earn/step-indicator/${step.id}/edit-button`}
                            >
                                <StepRow status={status} isEditable>
                                    {step.label}
                                </StepRow>
                            </PressableOpacity>
                        ) : (
                            <StepRow status={status}>{step.label}</StepRow>
                        )}
                        {!isLastStep && (
                            <View
                                style={applyStyle(connectorStyle, { isResolved: isStepResolved })}
                            />
                        )}
                    </View>
                );
            })}
        </View>
    );
};
