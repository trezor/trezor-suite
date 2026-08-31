import styled from 'styled-components';

import {
    selectCurrentCoinjoinWheelStates,
    selectCurrentSessionDeadlineInfo,
} from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { typography } from '@trezor/theme';

import { CountdownTimer } from 'src/components/suite';
import { SESSION_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';
import { useCoinjoinSessionPhase } from 'src/hooks/coinjoin';
const Cointainer = styled.div`
    height: 40px;
    margin-top: 4px;
    ${typography['body-xs']}
`;

const CountdownWrapper = styled.p`
    margin-top: 4px;
`;

interface CoinjoinStatusMessageProps {
    accountKey: AccountKey;
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
