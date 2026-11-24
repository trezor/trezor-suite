import { type ReactNode } from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { CurrentStepCard, FinishedStepCard, NextStepCard } from '@suite-native/step-cards';

import { ExchangeFlowStepTitle } from './ExchangeFlowStepTitle';
import {
    type ExchangeFlowApprovalStatus,
    type ExchangeFlowStep,
    getExchangeFlowStepCards,
} from '../../../utils/exchange/exchangeFlowSteps';

export type ExchangeFlowStepsLayoutProps = {
    approvalStatus: ExchangeFlowApprovalStatus;
    currentStep: ExchangeFlowStep;
    header: ReactNode;
    footer: ReactNode;
    children: ReactNode;
};

export const ExchangeFlowStepsLayout = ({
    approvalStatus,
    currentStep,
    header,
    footer,
    children,
}: ExchangeFlowStepsLayoutProps) => {
    const { lastFinishedStep, currentStepNumber, stepCount, nextSteps } = getExchangeFlowStepCards({
        approvalStatus,
        currentStep,
    });

    return (
        <Screen header={header} footer={footer}>
            <VStack spacing={0}>
                {!!lastFinishedStep && (
                    <FinishedStepCard title={<ExchangeFlowStepTitle step={lastFinishedStep} />} />
                )}
                <CurrentStepCard stepNumber={currentStepNumber} stepCount={stepCount}>
                    {children}
                </CurrentStepCard>
                {nextSteps.map(({ step, stepNumber }) => (
                    <NextStepCard
                        key={step}
                        stepNumber={stepNumber}
                        stepCount={stepCount}
                        title={<ExchangeFlowStepTitle step={step} />}
                    />
                ))}
            </VStack>
        </Screen>
    );
};
