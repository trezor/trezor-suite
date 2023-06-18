import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { variables, Card } from '@trezor/components';
import { restoreCoinjoinSession } from 'src/actions/wallet/coinjoinAccountActions';
import { useCoinjoinSessionBlockers } from 'src/hooks/coinjoin/useCoinjoinSessionBlockers';
import { ProgressWheel } from './ProgressWheel';
import { StatusMessage } from './StatusMessage';
import { SessionControlsMenu } from './SessionControlsMenu';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectCurrentCoinjoinWheelStates } from 'src/reducers/wallet/coinjoinReducer';
import { pauseCoinjoinSession } from 'src/actions/wallet/coinjoinClientActions';

const Container = styled(Card)<{ isWide?: boolean }>`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: ${({ isWide }) => (isWide ? '240px' : '180px')};
    height: 100%;
    padding: 10px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: center;
`;

interface CoinjoinStatusWheelProps {
    accountKey: string;
}

export const CoinjoinStatusWheel = ({ accountKey }: CoinjoinStatusWheelProps) => {
    const { isPaused, isSessionActive, isResumeBlockedByLastingIssue } = useSelector(
        selectCurrentCoinjoinWheelStates,
    );

    const { isCoinjoinSessionBlocked } = useCoinjoinSessionBlockers(accountKey);

    const dispatch = useDispatch();

    const togglePause = useCallback(() => {
        if (isCoinjoinSessionBlocked) {
            return;
        }

        if (isPaused) {
            dispatch(restoreCoinjoinSession(accountKey));
        } else {
            dispatch(pauseCoinjoinSession(accountKey));
        }
    }, [isCoinjoinSessionBlocked, isPaused, dispatch, accountKey]);

    return (
        <Container isWide={isSessionActive}>
            {isSessionActive && (
                <SessionControlsMenu accountKey={accountKey} togglePause={togglePause} />
            )}

            <ProgressWheel accountKey={accountKey} togglePause={togglePause} />

            {isSessionActive && !isResumeBlockedByLastingIssue && (
                <StatusMessage accountKey={accountKey} />
            )}
        </Container>
    );
};
