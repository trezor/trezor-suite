import { type ReactNode } from 'react';

import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { StepCardConnector } from './general/StepCardConnector';
import { StepCardStepper } from './general/StepCardStepper';

const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: 'transparent',
    borderColor: utils.colors.borderNeutral,
    borderWidth: utils.borders.widths.small,
    paddingVertical: utils.spacings.sp12,
}));

export type NextStepCardProps = {
    stepNumber: number;
    stepCount: number;
    title: ReactNode;
    children?: ReactNode;
};

export const NextStepCard = ({ stepNumber, stepCount, title, children }: NextStepCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <>
            <StepCardConnector isCompleted={false} />
            <Card noShadow style={applyStyle(cardStyle)} testID="@step-cards/next">
                <HStack spacing="sp8" alignItems="center" justifyContent="space-between">
                    <VStack>
                        <StepCardStepper
                            stepNumber={stepNumber}
                            stepCount={stepCount}
                            color="contentSecondary"
                        />
                        <Text variant="body-md">{title}</Text>
                    </VStack>
                    {children}
                </HStack>
            </Card>
        </>
    );
};
