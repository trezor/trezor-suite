import { selectCurrentCoinjoinWheelStates, stopCoinjoinSession } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Card, Column } from '@trezor/components';
import { StopIcon } from '@trezor/icons';

import { useDispatch } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';

import { CoinjoinProgressWheel } from './CoinjoinProgressWheel';
import { CoinjoinStatusMessage } from './CoinjoinStatusMessage';

interface CoinjoinStatusWheelProps {
    accountKey: AccountKey;
}

export const CoinjoinStatusWheel = ({ accountKey }: CoinjoinStatusWheelProps) => {
    const { isSessionActive, isResumeBlockedByLastingIssue, isPaused, isLoading } = useSelector(
        selectCurrentCoinjoinWheelStates,
    );

    const dispatch = useDispatch();

    return (
        <Card paddingType="small" height="100%">
            <Column
                alignItems="center"
                justifyContent="center"
                width={isSessionActive ? '240px' : '180px'}
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
                        onClick={() => dispatch(stopCoinjoinSession(accountKey))}
                        size="small"
                        margin={{ top: 8 }}
                    >
                        <Translation id="TR_STOP" />
                    </Button>
                )}
            </Column>
        </Card>
    );
};
