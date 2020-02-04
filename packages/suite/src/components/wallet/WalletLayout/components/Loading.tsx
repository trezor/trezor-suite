import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { AppState } from '@suite-types';

interface Props {
    type: AppState['wallet']['selectedAccount']['loader'];
}

const getMessage = (type: Props['type']) => {
    switch (type) {
        case 'waiting-for-device':
            return messages.TR_LOADING_DEVICE_DOT_DOT_DOT;
        case 'auth':
            return messages.TR_AUTHENTICATING_DEVICE;
        case 'account-loading':
            return messages.TR_LOADING_ACCOUNT;
        default:
            return undefined;
    }
};

const AccountLoader = ({ type }: Props) => {
    const title = getMessage(type) || messages.TR_LOADING_ACCOUNT;
    return (
        <NotificationCard variant="loader">
            <Translation>{title}</Translation>
        </NotificationCard>
    );
};

export default AccountLoader;
