import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import { AccountActions } from '@suite/actions/wallet/accountActions';

const AccountImported = () => (
    <NotificationCard variant="info">
        <Translation id="TR_ACCOUNT_IMPORTED_ANNOUNCEMENT" />
    </NotificationCard>
);

export default AccountImported;
