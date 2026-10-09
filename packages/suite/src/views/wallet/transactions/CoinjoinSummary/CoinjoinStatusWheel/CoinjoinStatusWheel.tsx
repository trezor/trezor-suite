import styled from 'styled-components';

import { selectCurrentCoinjoinWheelStates, stopCoinjoinSessionThunk } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { injectDispatch } from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Card, Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { StopIcon } from '@trezor/icons';
import { typography } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

import { CoinjoinProgressWheel } from './CoinjoinProgressWheel';
import { CoinjoinStatusMessage } from './CoinjoinStatusMessage';

const Content = styled.div`
    height: 100%;
    color: ${({ theme }) => theme.contentSecondary};
    text-align: center;
    ${typography['body-sm-strong']}
`;

interface CoinjoinStatusWheelProps {
    accountKey: AccountKey;
}

export const CoinjoinStatusWheel = ({ accountKey }: CoinjoinStatusWheelProps) => {
    const { isSessionActive, isResumeBlockedByLastingIssue, isPaused, isLoading } = useSelector(
        selectCurrentCoinjoinWheelStates,
    );

    const { dispatch } = useServices(injectDispatch);

    return (
        <Card paddingType="small" height="100%">
            <Content>
                <Column
                    alignItems="center"
                    justifyContent="center"
                    width={isSessionActive ? '240px' : '180px'}
                    height="100%"
                    margin={{ horizontal: 'auto' }}
                >
                    <CoinjoinProgressWheel accountKey={accountKey} />

                    {isSessionActive && !isResumeBlockedByLastingIssue && (
                        <CoinjoinStatusMessage accountKey={accountKey} />
                    )}

                    {isPaused && !isLoading && (
                        <Button
                            intent="neutral"
                            priority="secondary"
                            iconRight={StopIcon}
                            onClick={() => dispatch(stopCoinjoinSessionThunk(accountKey))}
                            size="small"
                            margin={{ top: 8 }}
                        >
                            <Translation id="TR_STOP" />
                        </Button>
                    )}
                </Column>
            </Content>
        </Card>
    );
};
