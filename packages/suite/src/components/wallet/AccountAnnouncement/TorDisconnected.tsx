import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import * as suiteActions from '@suite-actions/suiteActions';
import { selectTorState } from '@suite-reducers/suiteReducer';
import { selectIsCoinjoinSelectedAccountBlockedByTor } from '@wallet-reducers/coinjoinReducer';

export const TorDisconnected = () => {
    const { isTorLoading } = useSelector(selectTorState);
    const isCoinjoinBlockedByTor = useSelector(selectIsCoinjoinSelectedAccountBlockedByTor);
    const { toggleTor } = useActions({
        toggleTor: suiteActions.toggleTor,
    });

    if (!isCoinjoinBlockedByTor) return null;

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
