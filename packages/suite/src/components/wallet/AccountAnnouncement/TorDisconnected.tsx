import React from 'react';
import { NotificationCard, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { toggleTor } from 'src/actions/suite/suiteActions';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { selectIsCoinjoinBlockedByTor } from 'src/reducers/wallet/coinjoinReducer';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

export const TorDisconnected = () => {
    const account = useSelector(selectSelectedAccount);
    const { isTorLoading } = useSelector(selectTorState);
    const isCoinjoinBlockedByTor = useSelector(selectIsCoinjoinBlockedByTor);
    const dispatch = useDispatch();

    if (account?.accountType !== 'coinjoin' || !isCoinjoinBlockedByTor) return null;

    const handleButtonClick = () => dispatch(toggleTor(true));

    return (
        <NotificationCard
            variant="warning"
            button={{
                onClick: handleButtonClick,
                isLoading: isTorLoading,
                children: isTorLoading ? (
                    <Translation id="TR_ENABLING_TOR" />
                ) : (
                    <Translation id="TR_TOR_ENABLE" />
                ),
            }}
        >
            <Translation
                id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE"
                values={{
                    b: chunks => <b>{chunks}</b>,
                }}
            />
        </NotificationCard>
    );
};
