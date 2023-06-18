import React from 'react';
import { NotificationCard, Translation } from 'src/components/suite';
import { useActions, useSelector } from 'src/hooks/suite';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { selectIsCoinjoinBlockedByTor } from 'src/reducers/wallet/coinjoinReducer';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

export const TorDisconnected = () => {
    const account = useSelector(selectSelectedAccount);
    const { isTorLoading } = useSelector(selectTorState);
    const isCoinjoinBlockedByTor = useSelector(selectIsCoinjoinBlockedByTor);
    const { toggleTor } = useActions({
        toggleTor: suiteActions.toggleTor,
    });

    if (account?.accountType !== 'coinjoin' || !isCoinjoinBlockedByTor) return null;

    return (
        <NotificationCard
            variant="warning"
            button={{
                onClick: () => toggleTor(true),
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
