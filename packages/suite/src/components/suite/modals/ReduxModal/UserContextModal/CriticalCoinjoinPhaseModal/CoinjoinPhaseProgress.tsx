import styled, { useTheme } from 'styled-components';
import { CoinjoinSession, SessionPhase } from 'src/types/wallet/coinjoin';
import { Spinner, Icon, variables } from '@trezor/components';
import { SESSION_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';
import { Translation } from 'src/components/suite/Translation';
import { CountdownTimer } from 'src/components/suite/CountdownTimer';
import { RoundPhase } from '@trezor/coinjoin';

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

const Dot = styled.span`
    color: ${({ theme }) => theme.STROKE_GREY};
    font-size: 28px;
    line-height: 1;
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

const TimerCointainer = styled.p`
    margin-top: 4px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHTER_GREY};
    opacity: 0.9;
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
            {!isComplete && !isCurrent && <Dot>•</Dot>}

            {isCurrent && <Spinner size={16} />}

            {isComplete && <Icon icon="CHECK" size={28} color={theme.TYPE_DARK_GREY} />}
        </StepConiainer>
    );
};

interface CoinjoinPhaseProgressProps {
    roundPhase: RoundPhase;
    phaseDeadline: CoinjoinSession['roundPhaseDeadline'];
    sessionPhase: SessionPhase;
}

export const CoinjoinPhaseProgress = ({
    roundPhase,
    phaseDeadline,
    sessionPhase,
}: CoinjoinPhaseProgressProps) => (
    <Container>
        <Steps>
            <Step phase={RoundPhase.ConnectionConfirmation} currentPhase={roundPhase} />
            <Separator />
            <Step phase={RoundPhase.OutputRegistration} currentPhase={roundPhase} />
            <Separator />
            <Step phase={RoundPhase.TransactionSigning} currentPhase={roundPhase} />
        </Steps>

        <Message>
            <Translation id={SESSION_PHASE_MESSAGES[sessionPhase]} />
            ...
        </Message>

        {phaseDeadline && (
            <TimerCointainer>
                <CountdownTimer
                    isApproximate
                    deadline={phaseDeadline}
                    pastDeadlineMessage="TR_TIMER_PAST_DEADLINE"
                />
            </TimerCointainer>
        )}
    </Container>
);
