import { type CoinjoinSession } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { RoundPhase } from '@trezor/coinjoin';
import { Column, StepList, type StepListItemState } from '@trezor/components';

import { CountdownTimer } from 'src/components/suite/CountdownTimer';
import { ROUND_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';

type CoinjoinPhaseProgressProps = {
    roundPhase: RoundPhase;
    phaseDeadline: CoinjoinSession['roundPhaseDeadline'];
};

const getStepListItemState = (phase: RoundPhase, roundPhase: RoundPhase): StepListItemState => {
    if (phase === roundPhase) return 'default';
    if (phase < roundPhase) return 'done';

    return 'pending';
};

export const CoinjoinPhaseProgress = ({
    roundPhase,
    phaseDeadline,
}: CoinjoinPhaseProgressProps) => (
    <Column gap={16}>
        <StepList gap={16} bulletSize="medium">
            {Object.values(RoundPhase).map(phase => (
                <StepList.Item
                    key={phase}
                    state={getStepListItemState(phase, roundPhase)}
                    title={<Translation id={ROUND_PHASE_MESSAGES[phase]} />}
                />
            ))}
        </StepList>
        {phaseDeadline && (
            <CountdownTimer
                isApproximate
                deadline={phaseDeadline}
                pastDeadlineMessage="TR_TIMER_PAST_DEADLINE"
            />
        )}
    </Column>
);
