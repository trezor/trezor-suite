import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Card } from '@trezor/components';
import { spacings, typography } from '@trezor/theme';

import { stopCoinjoinSession } from 'src/actions/wallet/coinjoinClientActions';
import { useDispatch } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectCurrentCoinjoinWheelStates } from 'src/reducers/wallet/coinjoinReducer';

import { CoinjoinProgressWheel } from './CoinjoinProgressWheel';
import { CoinjoinStatusMessage } from './CoinjoinStatusMessage';

// eslint-disable-next-line local-rules/no-override-ds-component
const Container = styled(Card)<{ $isWide?: boolean }>`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: ${({ $isWide }) => ($isWide ? '240px' : '180px')};
    height: 100%;
    padding: 10px;
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm-strong']}
    text-align: center;

    > :first-child {
        justify-items: center;
    }
`;

interface CoinjoinStatusWheelProps {
    accountKey: AccountKey;
}

export const CoinjoinStatusWheel = ({ accountKey }: CoinjoinStatusWheelProps) => {
    const { isSessionActive, isResumeBlockedByLastingIssue, isPaused, isLoading } = useSelector(
        selectCurrentCoinjoinWheelStates,
    );

    const dispatch = useDispatch();

    return (
        <Container $isWide={isSessionActive}>
            <CoinjoinProgressWheel accountKey={accountKey} />

            {isSessionActive && !isResumeBlockedByLastingIssue && (
                <CoinjoinStatusMessage accountKey={accountKey} />
            )}

            {isPaused && !isLoading && (
                <Button
                    intent="neutral"
                    priority="secondary"
                    iconRight="stop"
                    onClick={() => dispatch(stopCoinjoinSession(accountKey))}
                    size="small"
                    margin={{ top: spacings.xs }}
                >
                    <Translation id="TR_STOP" />
                </Button>
            )}
        </Container>
    );
};
