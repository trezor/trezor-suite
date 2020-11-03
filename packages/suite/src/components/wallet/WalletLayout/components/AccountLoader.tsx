import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { AppState } from '@suite-types';

interface Props {
    type: AppState['wallet']['selectedAccount']['loader'];
}

const getMessage = (type: Props['type']) => {
    switch (type) {
        case 'waiting-for-device':
            return 'TR_LOADING_DEVICE_DOT_DOT_DOT';
        case 'auth':
            return 'TR_AUTHENTICATING_DEVICE';
        case 'account-loading':
            return 'TR_LOADING_ACCOUNT';
        default:
            return undefined;
    }
};

const AccountLoader = ({ type }: Props) => {
    const title = getMessage(type) || 'TR_LOADING_ACCOUNT';
    return (
        <NotificationCard variant="loader">
            <Translation id={title} />
        </NotificationCard>
    );
};

export default AccountLoader;
