import React from 'react';
import styled from 'styled-components';
import { RoundPhase } from '@suite-common/wallet-types';
import { FluidSpinner, Icon, useTheme, variables } from '@trezor/components';
import { COINJOIN_PHASE_MESSAGES } from '@suite-constants/coinjoin';
import { Translation } from '@suite-components/Translation';

const Container = styled.div`
    padding: 32px 38px 0;
`;

const Steps = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-bottom: 26px;
`;

const StepConiainer = styled.div<{ isCurrent: boolean; isComplete: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: ${({ theme, isCurrent, isComplete }) =>
        !isCurrent && !isComplete && `1.5px solid ${theme.STROKE_GREY}`};
    background: ${({ theme, isCurrent, isComplete }) => (isCurrent || isComplete) && theme.BG_GREY};
`;

const Message = styled.p`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHTER_GREY};
`;

const Separator = styled.div`
    height: 1px;
    width: 50px;
    background: ${({ theme }) => theme.STROKE_GREY};
`;

interface StepProps {
    phase: RoundPhase;
    currentPhase: RoundPhase;
}

const Step = ({ phase, currentPhase }: StepProps) => {
    const theme = useTheme();

    const isCurrent = phase === currentPhase;
    const isComplete = currentPhase > phase;

    return (
        <StepConiainer isCurrent={isCurrent} isComplete={isComplete}>
            {isCurrent ? (
                <FluidSpinner size={16} strokeWidth={2} color={theme.TYPE_LIGHTER_GREY} />
            ) : (
                <Icon
                    icon="CHECK"
                    size={28}
                    color={isComplete ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHTER_GREY}
                />
            )}
        </StepConiainer>
    );
};

interface PhaseProgress {
    currentPhase: RoundPhase;
}

export const PhaseProgress = ({ currentPhase }: PhaseProgress) => (
    <Container>
        <Steps>
            <Step phase={RoundPhase.ConnectionConfirmation} currentPhase={currentPhase} />
            <Separator />
            <Step phase={RoundPhase.OutputRegistration} currentPhase={currentPhase} />
            <Separator />
            <Step phase={RoundPhase.TransactionSigning} currentPhase={currentPhase} />
        </Steps>

        <Message>
            <Translation id={COINJOIN_PHASE_MESSAGES[currentPhase]} />
            ...
        </Message>
    </Container>
);
