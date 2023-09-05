import styled from 'styled-components';
import { variables, Card, Button, useTheme } from '@trezor/components';
import { ProgressWheel } from './ProgressWheel';
import { StatusMessage } from './StatusMessage';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectCurrentCoinjoinWheelStates } from 'src/reducers/wallet/coinjoinReducer';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { stopCoinjoinSession } from 'src/actions/wallet/coinjoinClientActions';

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

const StopButton = styled(Button)`
    /* 23px button height + 7 margin = 30 height of StatusMessage */
    margin-top: 7px;
    background: none;
`;

interface CoinjoinStatusWheelProps {
    accountKey: string;
}

export const CoinjoinStatusWheel = ({ accountKey }: CoinjoinStatusWheelProps) => {
    const { isSessionActive, isResumeBlockedByLastingIssue, isPaused, isLoading } = useSelector(
        selectCurrentCoinjoinWheelStates,
    );

    const theme = useTheme();
    const dispatch = useDispatch();

    return (
        <Container isWide={isSessionActive}>
            <ProgressWheel accountKey={accountKey} />

            {isSessionActive && !isResumeBlockedByLastingIssue && (
                <StatusMessage accountKey={accountKey} />
            )}

            {isPaused && !isLoading && (
                <StopButton
                    variant="tertiary"
                    icon="STOP"
                    alignIcon="right"
                    size={10}
                    color={theme.TYPE_LIGHT_GREY}
                    onClick={() => dispatch(stopCoinjoinSession(accountKey))}
                >
                    <Translation id="TR_STOP" />
                </StopButton>
            )}
        </Container>
    );
};
