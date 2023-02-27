import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { variables, Card } from '@trezor/components';
import {
    pauseCoinjoinSession,
    restoreCoinjoinSession,
} from '@wallet-actions/coinjoinAccountActions';
import { useCoinjoinSessionBlockers } from '@suite/hooks/coinjoin/useCoinjoinSessionBlockers';
import { ProgressWheel } from './ProgressWheel';
import { ProgressMessage } from './ProgressMessage';
import { SessionControlsMenu } from './SessionControlsMenu';
import { useSelector } from '@suite-hooks/useSelector';
import { selectCurrentCoinjoinWheelStates } from '@wallet-reducers/coinjoinReducer';

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
    const { isPaused, isSessionActive } = useSelector(selectCurrentCoinjoinWheelStates);

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

            {isSessionActive && <ProgressMessage accountKey={accountKey} />}
        </Container>
    );
};
