import React from 'react';
import { NotificationCard, Translation } from '@suite-components';

const LoadingOtherAccounts = () => (
    <NotificationCard variant="loader" data-test="@wallet/discovery-progress-bar">
        <Translation id="TR_LOADING_OTHER_ACCOUNTS" />
    </NotificationCard>
);

export default LoadingOtherAccounts;
