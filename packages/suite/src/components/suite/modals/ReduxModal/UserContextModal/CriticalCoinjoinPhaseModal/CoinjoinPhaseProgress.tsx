import { RoundPhase } from '@trezor/coinjoin';
import { BulletList, BulletListItemState, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CountdownTimer } from 'src/components/suite/CountdownTimer';
import { Translation } from 'src/components/suite/Translation';
import { ROUND_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';
import { CoinjoinSession } from 'src/types/wallet/coinjoin';

type CoinjoinPhaseProgressProps = {
    roundPhase: RoundPhase;
    phaseDeadline: CoinjoinSession['roundPhaseDeadline'];
};

const getBulletListItemState = (phase: RoundPhase, roundPhase: RoundPhase): BulletListItemState => {
    if (phase === roundPhase) return 'default';
    if (phase < roundPhase) return 'done';

    return 'pending';
};

export const CoinjoinPhaseProgress = ({
    roundPhase,
    phaseDeadline,
}: CoinjoinPhaseProgressProps) => (
    <Column gap={spacings.md}>
        <BulletList gap={spacings.md} bulletSize="medium">
            {Object.values(RoundPhase).map(phase => (
                <BulletList.Item
                    key={phase}
                    state={getBulletListItemState(phase, roundPhase)}
                    title={<Translation id={ROUND_PHASE_MESSAGES[phase]} />}
                />
            ))}
        </BulletList>
        {phaseDeadline && (
            <CountdownTimer
                isApproximate
                deadline={phaseDeadline}
                pastDeadlineMessage="TR_TIMER_PAST_DEADLINE"
            />
        )}
    </Column>
);
