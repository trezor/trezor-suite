import { type PropsWithChildren } from 'react';

import { Box, Card } from '@suite-native/atoms';

import { StepCardConnector } from '../general/StepCardConnector';
import { StepCardStepper } from '../general/StepCardStepper';

export type CurrentStepCardProps = PropsWithChildren<{
    stepNumber: number;
    stepCount: number;
}>;

export const CurrentStepCard = ({ stepNumber, stepCount, children }: CurrentStepCardProps) => (
    <>
        {stepNumber > 1 && <StepCardConnector isCompleted />}
        <Card noPadding testID="@step-cards/current">
            <Box padding="sp16" paddingBottom="sp8">
                <StepCardStepper
                    stepNumber={stepNumber}
                    stepCount={stepCount}
                    color="contentBrand"
                />
            </Box>
            {children}
        </Card>
    </>
);
