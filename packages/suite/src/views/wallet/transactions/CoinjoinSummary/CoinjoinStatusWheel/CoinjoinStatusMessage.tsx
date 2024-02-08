import styled from 'styled-components';
import { SESSION_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';
import { Translation } from 'src/components/suite/Translation';
import { CountdownTimer } from 'src/components/suite';
import { useCoinjoinSessionPhase } from 'src/hooks/coinjoin';
import { useSelector } from 'src/hooks/suite/useSelector';
import {
    selectCurrentCoinjoinWheelStates,
    selectCurrentSessionDeadlineInfo,
} from 'src/reducers/wallet/coinjoinReducer';
import { typography, spacingsPx } from '@trezor/theme';

const Cointainer = styled.div`
    height: 40px;
    margin-top: ${spacingsPx.xxs};
    ${typography.label}
`;

const CountdownWrapper = styled.p`
    margin-top: ${spacingsPx.xxs};
`;

interface CoinjoinStatusMessageProps {
    accountKey: string;
}

export const CoinjoinStatusMessage = ({ accountKey }: CoinjoinStatusMessageProps) => {
    const { isLoading, isPaused } = useSelector(selectCurrentCoinjoinWheelStates);
    const { roundPhase, roundPhaseDeadline } = useSelector(selectCurrentSessionDeadlineInfo);

    const sessionPhase = useCoinjoinSessionPhase(accountKey);

    const getStatusMessage = () => {
        if (isLoading) {
            return <Translation id="TR_RESUMING" />;
        }

        if (sessionPhase !== undefined) {
            return (
                <>
                    <Translation id={SESSION_PHASE_MESSAGES[sessionPhase]} />

                    {roundPhase !== undefined && roundPhaseDeadline && (
                        <CountdownWrapper>
                            <CountdownTimer
                                isApproximate
                                deadline={roundPhaseDeadline}
                                pastDeadlineMessage="TR_TIMER_PAST_DEADLINE"
                            />
                        </CountdownWrapper>
                    )}
                </>
            );
        }

        if (!isPaused) {
            return <Translation id="TR_LOOKING_FOR_COINJOIN_ROUND" />;
        }
    };

    return <Cointainer>{getStatusMessage()}</Cointainer>;
};
