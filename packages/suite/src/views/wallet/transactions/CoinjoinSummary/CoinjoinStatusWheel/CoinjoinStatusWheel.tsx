import { Translation } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Card, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { stopCoinjoinSession } from 'src/actions/wallet/coinjoinClientActions';
import { useDispatch } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectCurrentCoinjoinWheelStates } from 'src/reducers/wallet/coinjoinReducer';

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
                        iconRight="stop"
                        onClick={() => dispatch(stopCoinjoinSession(accountKey))}
                        size="small"
                        margin={{ top: spacings.xs }}
                    >
                        <Translation id="TR_STOP" />
                    </Button>
                )}
            </Column>
        </Card>
    );
};
