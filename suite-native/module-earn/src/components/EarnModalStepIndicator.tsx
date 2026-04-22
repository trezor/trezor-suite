import { type ReactNode } from 'react';
import { View } from 'react-native';

import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type StepStatus = 'done' | 'active' | 'pending';

type EarnModalStep = {
    id: string;
    label: ReactNode;
};

type EarnModalStepIndicatorProps = {
    currentStepIndex: number;
    steps: EarnModalStep[];
};

const getStepStatus = (stepIndex: number, currentStepIndex: number): StepStatus => {
    if (stepIndex < currentStepIndex) {
        return 'done';
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
            style: { backgroundColor: utils.colors.legacyBackgroundSecondaryDefault },
        },
        {
            condition: status === 'active',
            style: {
                backgroundColor: utils.colors.legacyBackgroundPrimarySubtleOnElevationNegative,
            },
        },
    ],
}));

const innerDotStyle = prepareNativeStyle<{ status: StepStatus }>((utils, { status }) => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: utils.colors.legacyBackgroundNeutralSubtleOnElevation0,
    extend: {
        condition: status === 'active',
        style: { backgroundColor: utils.colors.legacyBackgroundSecondaryDefault },
    },
}));

const connectorStyle = prepareNativeStyle<{ isDone: boolean }>((utils, { isDone }) => ({
    width: 2,
    height: 24,
    marginLeft: 8,
    marginVertical: -2,
    backgroundColor: 'transparent',
    extend: {
        condition: isDone,
        style: { backgroundColor: utils.colors.legacyBackgroundSecondaryDefault },
    },
}));

const containerStyle = prepareNativeStyle(utils => ({
    marginVertical: utils.spacings.sp8,
}));

const StepRow = ({ status, children }: { status: StepStatus; children: ReactNode }) => {
    const { applyStyle } = useNativeStyles();
    const isActive = status === 'active';

    return (
        <HStack spacing="sp12" alignItems="center">
            <View style={applyStyle(circleStyle, { status })}>
                {status === 'done' ? (
                    <Icon name="check" size="small" color="contentPrimaryInverse" />
                ) : (
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
                const status = getStepStatus(index, currentStepIndex);
                const isLastStep = index === steps.length - 1;

                return (
                    <View key={step.id}>
                        <StepRow status={status}>{step.label}</StepRow>
                        {!isLastStep && (
                            <View
                                style={applyStyle(connectorStyle, {
                                    isDone: status === 'done',
                                })}
                            />
                        )}
                    </View>
                );
            })}
        </View>
    );
};
