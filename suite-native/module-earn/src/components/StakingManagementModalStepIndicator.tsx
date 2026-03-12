import { ReactNode } from 'react';
import { View } from 'react-native';

import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export const StakingDetailModalStep = {
    TransactionConfirmed: 'TransactionConfirmed',
    InProgress: 'InProgress',
    Completed: 'Completed',
} as const;

export type StakingDetailModalStep =
    (typeof StakingDetailModalStep)[keyof typeof StakingDetailModalStep];

type StepStatus = 'done' | 'active' | 'pending';

const stepOrder = [
    StakingDetailModalStep.TransactionConfirmed,
    StakingDetailModalStep.InProgress,
    StakingDetailModalStep.Completed,
] as const;

const getStepStatus = (stepIndex: number, currentIndex: number): StepStatus => {
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'active';

    return 'pending';
};

type StakingManagementModalStepIndicatorProps = {
    currentStep: StakingDetailModalStep;
    inProgressLabel: ReactNode;
    completedLabel: ReactNode;
};

const circleStyle = prepareNativeStyle<{ status: StepStatus }>((utils, { status }) => ({
    width: 18,
    height: 18,
    borderRadius: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    extend: [
        {
            condition: status === 'done',
            style: { backgroundColor: utils.colors.backgroundSecondaryDefault },
        },
        {
            condition: status === 'active',
            style: { backgroundColor: utils.colors.backgroundPrimarySubtleOnElevationNegative },
        },
    ],
}));

const innerDotStyle = prepareNativeStyle<{ status: StepStatus }>((utils, { status }) => ({
    width: 8,
    height: 8,
    borderRadius: '100%',
    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation0,
    extend: {
        condition: status === 'active',
        style: { backgroundColor: utils.colors.backgroundSecondaryDefault },
    },
}));

const connectorStyle = prepareNativeStyle<{ isDone: boolean }>((utils, { isDone }) => ({
    width: 2,
    height: 24,
    marginLeft: 8, // (circleWidth - connectorWidth) / 2
    marginVertical: -2,
    backgroundColor: 'transparent',
    extend: {
        condition: isDone,
        style: { backgroundColor: utils.colors.backgroundSecondaryDefault },
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
                    <Icon name="check" size="small" color="iconOnSecondary" />
                ) : (
                    <View style={applyStyle(innerDotStyle, { status })} />
                )}
            </View>
            <Text
                variant={isActive ? 'body-sm-strong' : 'body-sm'}
                color={isActive ? undefined : 'textSubdued'}
            >
                {children}
            </Text>
        </HStack>
    );
};

export const StakingManagementModalStepIndicator = ({
    currentStep,
    inProgressLabel,
    completedLabel,
}: StakingManagementModalStepIndicatorProps) => {
    const { applyStyle } = useNativeStyles();

    const currentIndex = stepOrder.indexOf(currentStep);
    const transactionConfirmedStatus = getStepStatus(0, currentIndex);
    const inProgressStatus = getStepStatus(1, currentIndex);
    const completedStatus = getStepStatus(2, currentIndex);

    return (
        <View style={applyStyle(containerStyle)}>
            <StepRow status={transactionConfirmedStatus}>
                <Translation id="earn.stakingManagementScreen.pendingItemModal.stepTransactionConfirmed" />
            </StepRow>

            <View
                style={applyStyle(connectorStyle, {
                    isDone: transactionConfirmedStatus === 'done',
                })}
            />

            <StepRow status={inProgressStatus}>{inProgressLabel}</StepRow>

            <View style={applyStyle(connectorStyle, { isDone: inProgressStatus === 'done' })} />

            <StepRow status={completedStatus}>{completedLabel}</StepRow>
        </View>
    );
};
