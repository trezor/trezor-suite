import styled from 'styled-components';
import { SESSION_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';
import { variables } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { CountdownTimer } from 'src/components/suite';
import { useCoinjoinSessionPhase } from 'src/hooks/wallet/useCoinjoinSessionPhase';
import { useSelector } from 'src/hooks/suite/useSelector';
import {
    selectCurrentCoinjoinWheelStates,
    selectCurrentSessionDeadlineInfo,
} from 'src/reducers/wallet/coinjoinReducer';

const Cointainer = styled.div`
    height: 30px;
    margin-top: 4px;
    font-size: ${variables.FONT_SIZE.TINY};
`;

interface StatusMessageProps {
    accountKey: string;
}

export const StatusMessage = ({ accountKey }: StatusMessageProps) => {
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
                        <p>
                            <CountdownTimer
                                isApproximate
                                deadline={roundPhaseDeadline}
                                pastDeadlineMessage="TR_TIMER_PAST_DEADLINE"
                            />
                        </p>
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
